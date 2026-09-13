// Package webui serves the courses directory as browsable HTML on
// localhost: markdown files are rendered on the fly, directories fall back
// to their README.md, and everything else is served as a plain file.
//
// The content source is an fs.FS, so the same handler serves either the
// on-disk ./courses-en tree (default build, live-reload) or a copy embedded
// into the binary (build with -tags embed). See Options.FS.
package webui

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"io/fs"
	"net/http"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"runtime"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"

	"mockctl/internal/lab"
)

// Options configures Serve.
type Options struct {
	// Port to listen on.
	Port int
	// Bind is the listen address. Empty or omitted means 127.0.0.1 (local
	// mockctl.exe). Use 0.0.0.0 inside Docker so published ports work.
	Bind string
	// CoursesDir overrides the directory to serve from disk. Empty means
	// "./courses-en" relative to the current working directory. Ignored when
	// FS is set.
	CoursesDir string
	// OpenBrowser launches the system browser once the server is ready.
	OpenBrowser bool
	// FS, when non-nil, is served instead of the on-disk courses directory.
	// It's how embedded builds (-tags embed) inject their bundled copy.
	// An explicit CoursesDir always wins over FS (handled by the caller).
	FS fs.FS
	// FSName is a human-readable label for FS, shown in the startup log
	// (e.g. "(embedded)"). Ignored when FS is nil.
	FSName string
}

var md = goldmark.New(goldmark.WithExtensions(extension.GFM))

// Serve blocks, running an HTTP server that renders the courses content as
// HTML. Content comes from opts.FS when set, otherwise from disk.
func Serve(opts Options) error {
	fsys, label, err := resolveSource(opts)
	if err != nil {
		return err
	}

	bind := opts.Bind
	if bind == "" {
		bind = "127.0.0.1"
	}
	addr := fmt.Sprintf("%s:%d", bind, opts.Port)
	// Always advertise localhost in logs/browser — even when bind is 0.0.0.0.
	url := fmt.Sprintf("http://127.0.0.1:%d/", opts.Port)

	engine := lab.NewEngine(fsys)

	mux := http.NewServeMux()
	mux.HandleFunc("/api/lab/", newLabHandler(engine))
	mux.HandleFunc("/", newHandler(fsys, engine))

	fmt.Println("Serving courses from:", label)
	fmt.Println("Open:", url)
	fmt.Println("Stop with Ctrl+C.")

	if opts.OpenBrowser {
		go func() {
			time.Sleep(300 * time.Millisecond)
			_ = openBrowser(url)
		}()
	}

	return http.ListenAndServe(addr, mux)
}

// resolveSource picks the content filesystem and a label for logging. An
// embedded FS is used only when no explicit --courses-dir was given.
func resolveSource(opts Options) (fs.FS, string, error) {
	if opts.FS != nil && opts.CoursesDir == "" {
		label := opts.FSName
		if label == "" {
			label = "(embedded)"
		}
		return opts.FS, label, nil
	}

	root, err := resolveCoursesDir(opts.CoursesDir)
	if err != nil {
		return nil, "", err
	}
	return os.DirFS(root), root, nil
}

func resolveCoursesDir(dir string) (string, error) {
	if dir == "" {
		wd, err := os.Getwd()
		if err != nil {
			return "", err
		}
		dir = filepath.Join(wd, "courses-en")
	}
	abs, err := filepath.Abs(dir)
	if err != nil {
		return "", err
	}
	info, err := os.Stat(abs)
	if err != nil {
		return "", fmt.Errorf("courses directory %q not found — run mockctl from the repository root, or pass --courses-dir (or build with -tags embed): %w", abs, err)
	}
	if !info.IsDir() {
		return "", fmt.Errorf("%q is not a directory", abs)
	}
	return abs, nil
}

func newHandler(fsys fs.FS, engine *lab.Engine) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		urlPath := path.Clean("/" + r.URL.Path)

		// fs.FS uses slash paths rooted at "." with no leading slash;
		// the leading "/" fed to path.Clean already prevents "../" escapes.
		name := strings.TrimPrefix(urlPath, "/")
		if name == "" {
			name = "."
		}
		if !fs.ValidPath(name) {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}

		info, err := fs.Stat(fsys, name)
		if err != nil {
			http.Error(w, "not found: "+urlPath, http.StatusNotFound)
			return
		}

		if info.IsDir() {
			readmePath := path.Join(name, "README.md")
			if _, err := fs.Stat(fsys, readmePath); err == nil {
				target := strings.TrimSuffix(urlPath, "/") + "/README.md"
				http.Redirect(w, r, target, http.StatusFound)
				return
			}
			serveDirListing(w, urlPath, fsys, name)
			return
		}

		if strings.EqualFold(path.Ext(name), ".md") {
			serveMarkdown(w, urlPath, fsys, name, engine)
			return
		}

		http.ServeFileFS(w, r, fsys, name)
	}
}

// labResponse is the JSON returned by every /api/lab/ action.
type labResponse struct {
	OK       bool         `json:"ok"`
	Passed   bool         `json:"passed"`
	Error    string       `json:"error,omitempty"`
	Results  []lab.Result `json:"results,omitempty"`
	Score    *int         `json:"score,omitempty"`
	MaxScore *int         `json:"maxScore,omitempty"`
	Note     string       `json:"note,omitempty"`
}

// newLabHandler serves the lab lifecycle API: POST /api/lab/{start,check,
// cleanup}?path=<lesson fs path>. It returns JSON verdicts and never binds
// beyond 127.0.0.1 (the parent mux does).
func newLabHandler(engine *lab.Engine) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		action := strings.TrimPrefix(r.URL.Path, "/api/lab/")
		lessonPath := r.URL.Query().Get("path")
		if !fs.ValidPath(lessonPath) {
			writeLabJSON(w, http.StatusBadRequest, labResponse{Error: "invalid lab path"})
			return
		}

		def, err := engine.Load(lessonPath)
		if err != nil {
			writeLabJSON(w, http.StatusNotFound, labResponse{Error: err.Error()})
			return
		}

		switch action {
		case "start":
			results, note, err := engine.StartDetailed(def)
			if err != nil {
				writeLabJSON(w, http.StatusInternalServerError, labResponse{Error: err.Error(), Results: results, Note: note})
				return
			}
			writeLabJSON(w, http.StatusOK, labResponse{OK: true, Results: results, Note: note})
		case "check":
			rep, err := engine.CheckDetailed(def)
			if err != nil {
				writeLabJSON(w, http.StatusInternalServerError, labResponse{Error: err.Error(), Results: rep.Results, Note: rep.Note})
				return
			}
			writeLabJSON(w, http.StatusOK, labResponse{
				OK:       true,
				Passed:   rep.Passed,
				Results:  rep.Results,
				Score:    rep.Score,
				MaxScore: rep.MaxScore,
				Note:     rep.Note,
			})
		case "cleanup":
			note, err := engine.CleanupDetailed(def)
			if err != nil {
				writeLabJSON(w, http.StatusInternalServerError, labResponse{Error: err.Error(), Note: note})
				return
			}
			writeLabJSON(w, http.StatusOK, labResponse{OK: true, Note: note})
		default:
			writeLabJSON(w, http.StatusNotFound, labResponse{Error: "unknown action: " + action})
		}
	}
}

func writeLabJSON(w http.ResponseWriter, status int, resp labResponse) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(resp)
}

func serveMarkdown(w http.ResponseWriter, urlPath string, fsys fs.FS, name string, engine *lab.Engine) {
	src, err := fs.ReadFile(fsys, name)
	if err != nil {
		http.Error(w, "read error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var body bytes.Buffer
	if err := md.Convert(src, &body); err != nil {
		http.Error(w, "render error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	prev, next := siblingNav(fsys, name, urlPath)

	labPath := ""
	if engine != nil && engine.HasLab(name) {
		labPath = name
	}

	// The lab panel is injected right after the page's <h1>, so it sits
	// under the title instead of at the very bottom of the lesson.
	head, rest := splitAfterH1(body.String())

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = pageTemplate.Execute(w, pageData{
		Title:    pageTitle(src, path.Base(name)),
		Path:     urlPath,
		TocHref:  tocHref(name),
		BodyHead: template.HTML(head), //nolint:gosec // body is our own goldmark output
		BodyRest: template.HTML(rest), //nolint:gosec // body is our own goldmark output
		Prev:     prev,
		Next:     next,
		LabPath:  labPath,
	})
}

// splitAfterH1 splits rendered HTML into the part up to and including the
// first </h1> and everything after it. When there's no <h1>, the whole
// document is returned as head and rest is empty.
func splitAfterH1(html string) (head, rest string) {
	const closeTag = "</h1>"
	idx := strings.Index(strings.ToLower(html), closeTag)
	if idx == -1 {
		return html, ""
	}
	cut := idx + len(closeTag)
	return html[:cut], html[cut:]
}

// siblingNav builds "previous"/"next" links for the markdown file `name`
// (an fs path like "fastapi/02-first-app.md") by ordering the .md files in
// its directory. Either link may be nil at the ends of the sequence.
func siblingNav(fsys fs.FS, name, urlPath string) (*navLink, *navLink) {
	dir := path.Dir(name)
	ordered := orderedMarkdown(fsys, dir)
	base := path.Base(name)

	idx := -1
	for i, e := range ordered {
		if strings.EqualFold(e, base) {
			idx = i
			break
		}
	}
	if idx == -1 {
		return nil, nil
	}

	urlDir := path.Dir(urlPath)
	link := func(entry string) *navLink {
		neighbor := path.Join(dir, entry)
		label := entry
		if src, err := fs.ReadFile(fsys, neighbor); err == nil {
			label = pageTitle(src, entry)
		}
		return &navLink{Href: path.Join(urlDir, entry), Label: label}
	}

	var prev, next *navLink
	if idx > 0 {
		prev = link(ordered[idx-1])
	}
	if idx < len(ordered)-1 {
		next = link(ordered[idx+1])
	}
	return prev, next
}

// orderedMarkdown returns the non-hidden .md files in dir, ordered as a
// course reads: README.md first, then lessons by their leading number
// (01-, 02-, ...), then any remaining files alphabetically.
func orderedMarkdown(fsys fs.FS, dir string) []string {
	entries, err := fs.ReadDir(fsys, dir)
	if err != nil {
		return nil
	}
	var files []string
	for _, e := range entries {
		n := e.Name()
		if e.IsDir() || strings.HasPrefix(n, ".") {
			continue
		}
		if strings.EqualFold(path.Ext(n), ".md") {
			files = append(files, n)
		}
	}
	sort.SliceStable(files, func(i, j int) bool { return lessLesson(files[i], files[j]) })
	return files
}

func lessLesson(a, b string) bool {
	ra := strings.EqualFold(a, "README.md")
	rb := strings.EqualFold(b, "README.md")
	if ra != rb {
		return ra // README.md sorts first
	}
	na, oka := leadingNum(a)
	nb, okb := leadingNum(b)
	if oka && okb {
		if na != nb {
			return na < nb
		}
		return strings.ToLower(a) < strings.ToLower(b)
	}
	if oka != okb {
		return oka // numbered lessons before non-numbered extras
	}
	return strings.ToLower(a) < strings.ToLower(b)
}

// leadingNum parses a run of leading ASCII digits, e.g. "02-first-app.md" -> 2.
func leadingNum(s string) (int, bool) {
	i := 0
	for i < len(s) && s[i] >= '0' && s[i] <= '9' {
		i++
	}
	if i == 0 {
		return 0, false
	}
	n, err := strconv.Atoi(s[:i])
	if err != nil {
		return 0, false
	}
	return n, true
}

func serveDirListing(w http.ResponseWriter, urlPath string, fsys fs.FS, name string) {
	entries, err := fs.ReadDir(fsys, name)
	if err != nil {
		http.Error(w, "read error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	base := strings.TrimSuffix(urlPath, "/")
	var items []listItem
	for _, e := range entries {
		entryName := e.Name()
		if strings.HasPrefix(entryName, ".") {
			continue
		}
		href := base + "/" + entryName
		if e.IsDir() {
			href += "/"
			entryName += "/"
		}
		items = append(items, listItem{Name: entryName, Href: href})
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = listTemplate.Execute(w, listData{
		Path:    urlPath,
		TocHref: tocHref(name),
		Items:   items,
	})
}

// tocHref returns a stable "course table of contents" URL for the current fs
// path. For lesson pages inside a course directory, it's /<course>/README.md.
// At the root level, it falls back to /README.md.
func tocHref(name string) string {
	if name == "." || name == "" || strings.EqualFold(name, "README.md") {
		return "/README.md"
	}
	base := strings.TrimSuffix(name, "/")
	parts := strings.Split(base, "/")
	if len(parts) == 0 || parts[0] == "." || parts[0] == "" {
		return "/README.md"
	}
	// Paths like "kuber-basic/07-lab.md" and "kuber-basic/" both map to the
	// course README.
	if len(parts) >= 1 {
		return "/" + parts[0] + "/README.md"
	}
	return "/README.md"
}

// pageTitle pulls the first ATX H1 ("# Title") out of the raw markdown, or
// falls back to the filename.
func pageTitle(src []byte, fallback string) string {
	for _, line := range strings.Split(string(src), "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "# ") {
			return strings.TrimSpace(strings.TrimPrefix(line, "# "))
		}
	}
	return fallback
}

func openBrowser(url string) error {
	switch runtime.GOOS {
	case "windows":
		return exec.Command("cmd", "/c", "start", "", url).Start()
	case "darwin":
		return exec.Command("open", url).Start()
	default:
		return exec.Command("xdg-open", url).Start()
	}
}

type pageData struct {
	Title string
	Path  string
	// TocHref points to the current course's README (table of contents).
	TocHref string
	// BodyHead is the rendered markdown up to and including the first <h1>;
	// BodyRest is everything after it. The lab panel is placed between them.
	BodyHead template.HTML
	BodyRest template.HTML
	Prev     *navLink
	Next     *navLink
	// LabPath is the lesson's fs path when the page has an interactive lab
	// (a sibling .lab.json); empty otherwise. It drives the lab panel.
	LabPath string
}

type navLink struct {
	Href  string
	Label string
}

type listData struct {
	Path    string
	TocHref string
	Items   []listItem
}

type listItem struct {
	Name string
	Href string
}

const pageCSS = `
body { max-width: 860px; margin: 2rem auto; padding: 0 1.25rem; font-family: -apple-system, Segoe UI, Helvetica, Arial, sans-serif; line-height: 1.55; color: #1c1e21; }
nav.crumb { font-size: 0.85rem; color: #666; margin-bottom: 1rem; }
nav.crumb a { color: #666; }
.toc-link { margin-left: 0.55rem; font-size: 0.85rem; }
pre { background: #f4f4f4; padding: 0.75rem 1rem; overflow-x: auto; border-radius: 6px; }
code { background: #f4f4f4; padding: 0.1em 0.35em; border-radius: 4px; font-size: 0.92em; }
pre code { background: none; padding: 0; }
table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
th, td { border: 1px solid #ddd; padding: 0.4rem 0.6rem; text-align: left; }
th { background: #fafafa; }
a { color: #0b6cff; text-decoration: none; }
a:hover { text-decoration: underline; }
h1, h2, h3 { line-height: 1.25; }
ul.dirlist { list-style: none; padding: 0; }
ul.dirlist li { padding: 0.15rem 0; }
nav.pager { display: flex; justify-content: space-between; gap: 1rem; margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid #eee; }
nav.pager a { max-width: 48%; padding: 0.5rem 0.9rem; border: 1px solid #ddd; border-radius: 6px; }
nav.pager a:hover { text-decoration: none; border-color: #0b6cff; }
nav.pager .next { margin-left: auto; text-align: right; }
.lab-panel { margin: 2rem 0; padding: 1rem 1.25rem; border: 1px solid #d7dde5; border-radius: 8px; background: #f8fafc; }
.lab-panel h2 { margin-top: 0; font-size: 1.05rem; }
.lab-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; margin: 0.75rem 0; }
.lab-actions button { padding: 0.5rem 1rem; border: 1px solid #0b6cff; border-radius: 6px; background: #0b6cff; color: #fff; font-size: 0.9rem; cursor: pointer; }
.lab-actions button.secondary { background: #fff; color: #0b6cff; }
.lab-actions button:disabled { opacity: 0.5; cursor: default; }
.lab-status { font-size: 0.9rem; margin: 0.5rem 0; min-height: 1.2em; }
.lab-verdict { font-weight: 600; margin: 0.5rem 0; }
.lab-verdict.pass { color: #157f3b; }
.lab-verdict.fail { color: #b3261e; }
.lab-results { list-style: none; padding: 0; margin: 0.5rem 0 0; }
.lab-results li { padding: 0.25rem 0; font-size: 0.9rem; }
.lab-results li .mark { display: inline-block; width: 1.4em; }
.lab-results li.ok .mark { color: #157f3b; }
.lab-results li.no .mark { color: #b3261e; }
.lab-results li .msg { color: #666; }
.copy-page-btn {
  position: fixed;
  top: 14px;
  right: 14px;
  z-index: 50;
  width: 34px;
  height: 34px;
  border: 1px solid #d0d7de;
  border-radius: 8px;
  background: #fff;
  color: #1f2328;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}
.copy-page-btn:hover { border-color: #0b6cff; }
`

var pageTemplate = template.Must(template.New("page").Parse(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{{.Title}}</title>
<style>` + pageCSS + `</style>
</head>
<body>
<button class="copy-page-btn" type="button" title="Copy text" aria-label="Copy text">⧉</button>
<nav class="crumb"><a href="/">courses</a> — {{.Path}} <a class="toc-link" href="{{.TocHref}}">Contents</a></nav>
<div data-copy-chunk="true">{{.BodyHead}}</div>
{{if .LabPath}}<section class="lab-panel" data-lab-path="{{.LabPath}}">
<h2>Interactive lab</h2>
<p class="lab-hint">Start prepares the environment, Check validates your work (Kubernetes or LocalStack), Cleanup removes this lab's resources.</p>
<div class="lab-actions">
<button type="button" data-action="start">Start lab</button>
<button type="button" data-action="check" class="secondary">Check</button>
<button type="button" data-action="cleanup" class="secondary">Cleanup</button>
</div>
<div class="lab-status"></div>
<div class="lab-verdict"></div>
<ul class="lab-results"></ul>
</section>
<script>
(function () {
  var panel = document.querySelector(".lab-panel");
  if (!panel) return;
  var labPath = panel.getAttribute("data-lab-path");
  var statusEl = panel.querySelector(".lab-status");
  var verdictEl = panel.querySelector(".lab-verdict");
  var resultsEl = panel.querySelector(".lab-results");
  var buttons = panel.querySelectorAll("button");

  function setBusy(busy) {
    buttons.forEach(function (b) { b.disabled = busy; });
  }
  function clearVerdict() {
    verdictEl.textContent = "";
    verdictEl.className = "lab-verdict";
    resultsEl.innerHTML = "";
  }
  function renderResults(results) {
    resultsEl.innerHTML = "";
    (results || []).forEach(function (r) {
      var li = document.createElement("li");
      li.className = r.passed ? "ok" : "no";
      var mark = document.createElement("span");
      mark.className = "mark";
      mark.textContent = r.passed ? "\u2714" : "\u2716";
      var name = document.createElement("span");
      name.textContent = r.name;
      var msg = document.createElement("span");
      msg.className = "msg";
      msg.textContent = r.message ? " — " + r.message : "";
      li.appendChild(mark);
      li.appendChild(name);
      li.appendChild(msg);
      resultsEl.appendChild(li);
    });
  }

  function run(action) {
    setBusy(true);
    statusEl.textContent = "Running " + action + "\u2026";
    clearVerdict();
    fetch("/api/lab/" + action + "?path=" + encodeURIComponent(labPath), { method: "POST" })
      .then(function (resp) { return resp.json(); })
      .then(function (data) {
        if (data.error) {
          statusEl.textContent = "";
          verdictEl.textContent = "Error: " + data.error;
          verdictEl.className = "lab-verdict fail";
          renderResults(data.results);
          return;
        }
        if (data.results && data.results.length) {
          renderResults(data.results);
        }
        if (action === "start") {
          statusEl.textContent = data.note || "Lab ready. Do the tasks above, then press Check.";
        } else if (action === "cleanup") {
          statusEl.textContent = data.note || "Cleaned up. The cluster is still running.";
        } else if (action === "check") {
          var score = "";
          if (data.score != null && data.maxScore != null) {
            score = " Score: " + data.score + "/" + data.maxScore;
          }
          verdictEl.textContent = data.passed
            ? "PASSED" + score
            : "Not there yet" + score + " — fix the failing checks and try again.";
          verdictEl.className = "lab-verdict " + (data.passed ? "pass" : "fail");
          statusEl.textContent = data.note || "";
        }
      })
      .catch(function (err) {
        statusEl.textContent = "";
        verdictEl.textContent = "Request failed: " + err;
        verdictEl.className = "lab-verdict fail";
      })
      .finally(function () { setBusy(false); });
  }

  buttons.forEach(function (b) {
    b.addEventListener("click", function () { run(b.getAttribute("data-action")); });
  });
})();
</script>{{end}}
<div data-copy-chunk="true">{{.BodyRest}}</div>
<script>
(function () {
  var btn = document.querySelector(".copy-page-btn");
  if (!btn) return;
  var resetTimer = null;
  function setTip(text) {
    btn.title = text;
    btn.setAttribute("aria-label", text);
    if (resetTimer) clearTimeout(resetTimer);
    if (text !== "Copy text") {
      resetTimer = setTimeout(function () { setTip("Copy text"); }, 1200);
    }
  }
  function collectText() {
    var chunks = document.querySelectorAll("[data-copy-chunk]");
    var out = [];
    chunks.forEach(function (el) {
      var t = (el.innerText || "").trim();
      if (t) out.push(t);
    });
    return out.join("\\n\\n").trim();
  }
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    var ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
  btn.addEventListener("click", function () {
    var text = collectText();
    if (!text) {
      setTip("Nothing to copy");
      return;
    }
    var copied = false;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () {
        setTip("Copied!");
      }).catch(function () {
        copied = fallbackCopy(text);
        setTip(copied ? "Copied!" : "Copy failed");
      });
      return;
    }
    copied = fallbackCopy(text);
    setTip(copied ? "Copied!" : "Copy failed");
  });
})();
</script>
{{if or .Prev .Next}}<nav class="pager">
{{if .Prev}}<a class="prev" href="{{.Prev.Href}}">← {{.Prev.Label}}</a>{{else}}<span></span>{{end}}
{{if .Next}}<a class="next" href="{{.Next.Href}}">{{.Next.Label}} →</a>{{end}}
</nav>{{end}}
</body>
</html>
`))

var listTemplate = template.Must(template.New("list").Parse(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{{.Path}}</title>
<style>` + pageCSS + `</style>
</head>
<body>
<button class="copy-page-btn" type="button" title="Copy text" aria-label="Copy text">⧉</button>
<nav class="crumb"><a href="/">courses</a> — {{.Path}} <a class="toc-link" href="{{.TocHref}}">Contents</a></nav>
<div id="list-copy-chunk" data-copy-chunk="true">
<h1>{{.Path}}</h1>
<ul class="dirlist">
{{range .Items}}<li><a href="{{.Href}}">{{.Name}}</a></li>
{{end}}
</ul>
</div>
<script>
(function () {
  var btn = document.querySelector(".copy-page-btn");
  var root = document.getElementById("list-copy-chunk");
  if (!btn || !root) return;
  var resetTimer = null;
  function setTip(text) {
    btn.title = text;
    btn.setAttribute("aria-label", text);
    if (resetTimer) clearTimeout(resetTimer);
    if (text !== "Copy text") {
      resetTimer = setTimeout(function () { setTip("Copy text"); }, 1200);
    }
  }
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    var ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
  btn.addEventListener("click", function () {
    var text = (root.innerText || "").trim();
    if (!text) {
      setTip("Nothing to copy");
      return;
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () {
        setTip("Copied!");
      }).catch(function () {
        setTip(fallbackCopy(text) ? "Copied!" : "Copy failed");
      });
      return;
    }
    setTip(fallbackCopy(text) ? "Copied!" : "Copy failed");
  });
})();
</script>
</body>
</html>
`))
