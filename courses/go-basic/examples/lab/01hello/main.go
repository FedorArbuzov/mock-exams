// Лаба 01 — первый запуск. См. courses/go-basic/03-lab-first-programs.md
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
