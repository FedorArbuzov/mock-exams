// Package procutil holds small process-execution helpers shared by the
// installer, cluster and lab packages.
package procutil

import (
	"bytes"
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

// RunCapture runs a command with an optional stdin payload and returns its
// captured stdout and stderr. Unlike RunStream nothing is echoed to the
// terminal — it's meant for programmatic callers (e.g. the lab engine
// shelling out to `kubectl ... -o json`). A nil stdin means no input.
func RunCapture(stdin []byte, name string, args ...string) (stdout, stderr string, err error) {
	cmd := exec.Command(name, args...)
	if stdin != nil {
		cmd.Stdin = bytes.NewReader(stdin)
	}
	var outBuf, errBuf bytes.Buffer
	cmd.Stdout = &outBuf
	cmd.Stderr = &errBuf
	err = cmd.Run()
	return outBuf.String(), errBuf.String(), err
}
