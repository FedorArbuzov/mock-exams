// Package webui serves the courses directory as browsable HTML on
// localhost: markdown files are rendered on the fly, directories fall back
// to their README.md, and everything else is served as a plain file.
//
// The content source is an fs.FS, so the same handler serves either the
// on-disk ./courses tree (default build, live-reload) or a copy embedded
// into the binary (build with -tags embed). See Options.FS.
package webui

import (
	"bytes"
	"fmt"
	"html/template"
	"io/fs"
	"net/http"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"
)

// Options configures Serve.
type Options struct {
	// Port to listen on. The server always binds to 127.0.0.1, never to a
	// public interface, since it just mirrors the local repo's courses/.
	Port int
	// CoursesDir overrides the directory to serve from disk. Empty means
	// "./courses" relative to the current working directory. Ignored when
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

	addr := fmt.Sprintf("127.0.0.1:%d", opts.Port)
	url := fmt.Sprintf("http://%s/", addr)

	mux := http.NewServeMux()
	mux.HandleFunc("/", newHandler(fsys))

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
		dir = filepath.Join(wd, "courses")
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

func newHandler(fsys fs.FS) http.HandlerFunc {
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
			serveMarkdown(w, urlPath, fsys, name)
			return
		}

		http.ServeFileFS(w, r, fsys, name)
	}
}

func serveMarkdown(w http.ResponseWriter, urlPath string, fsys fs.FS, name string) {
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

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = pageTemplate.Execute(w, pageData{
		Title: pageTitle(src, path.Base(name)),
		Path:  urlPath,
		Body:  template.HTML(body.String()), //nolint:gosec // body is our own goldmark output
	})
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
		Path:  urlPath,
		Items: items,
	})
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
	Body  template.HTML
}

type listData struct {
	Path  string
	Items []listItem
}

type listItem struct {
	Name string
	Href string
}

const pageCSS = `
body { max-width: 860px; margin: 2rem auto; padding: 0 1.25rem; font-family: -apple-system, Segoe UI, Helvetica, Arial, sans-serif; line-height: 1.55; color: #1c1e21; }
nav.crumb { font-size: 0.85rem; color: #666; margin-bottom: 1rem; }
nav.crumb a { color: #666; }
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
`

var pageTemplate = template.Must(template.New("page").Parse(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{{.Title}}</title>
<style>` + pageCSS + `</style>
</head>
<body>
<nav class="crumb"><a href="/">courses</a> — {{.Path}}</nav>
{{.Body}}
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
<nav class="crumb"><a href="/">courses</a> — {{.Path}}</nav>
<h1>{{.Path}}</h1>
<ul class="dirlist">
{{range .Items}}<li><a href="{{.Href}}">{{.Name}}</a></li>
{{end}}
</ul>
</body>
</html>
`))
