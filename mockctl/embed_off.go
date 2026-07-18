//go:build !embed

package main

import "io/fs"

// embeddedCourses reports that no courses are baked into this binary. This is
// the default build: `mockctl web` serves ./courses from disk, so edits to
// markdown show up on refresh without a rebuild.
//
// Build with `-tags embed` (see embed_on.go) to bundle a copy instead.
func embeddedCourses() (fs.FS, string, bool) {
	return nil, "", false
}
