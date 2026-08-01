//go:build embed

package main

import (
	"embed"
	"io/fs"
)

// coursesFS holds a copy of the courses tree baked into the binary at build
// time. go:embed can't reach outside the module (../courses-en), so the build
// scripts copy the repo's courses-en/ into mockctl/courses/ before compiling
// with `-tags embed`; that directory is gitignored.
//
// The all: prefix keeps files that start with "." or "_" (e.g. .pages).
//
//go:embed all:courses
var coursesFS embed.FS

// embeddedCourses returns the bundled courses tree so `mockctl web` works
// without the repository on disk. An explicit --courses-dir still overrides
// it (handled in webui.resolveSource).
func embeddedCourses() (fs.FS, string, bool) {
	sub, err := fs.Sub(coursesFS, "courses")
	if err != nil {
		return nil, "", false
	}
	return sub, "(embedded)", true
}
