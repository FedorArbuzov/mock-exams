# Reload Machine + User PATH into this session (use after winget/choco without opening a new terminal).
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
