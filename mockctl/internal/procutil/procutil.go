// Package procutil holds small process-execution helpers shared by the
// installer and cluster packages.
package procutil

import (
	"os"
	"os/exec"
)

// RunStream runs a command and streams its stdin/stdout/stderr through to
// the current process, so interactive output (progress, prompts) shows up
// exactly as if the command had been run directly.
func RunStream(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin
	return cmd.Run()
}
