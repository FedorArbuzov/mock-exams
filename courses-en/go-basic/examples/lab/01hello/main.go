// Lab 01 — first run. See courses-en/go-basic/00-environment.md
package main

import (
	"fmt"
	"runtime"
)

func main() {
	fmt.Println("Hello from lab 01")
	fmt.Println("Go version:", runtime.Version())
	fmt.Println("OS/Arch:", runtime.GOOS, runtime.GOARCH)
}
