' MosMA Chat - Application Launcher (VBScript)
' This script starts the local chat application server
' No console window will appear - just the browser

Set objShell = CreateObject("WScript.Shell")
strPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

' Check if Node.js is installed
On Error Resume Next
objShell.Exec "node --version"
If Err.Number <> 0 Then
    MsgBox "Node.js is not installed!" & vbCrLf & vbCrLf & "Please install Node.js from: https://nodejs.org/", vbCritical, "Error"
    WScript.Quit 1
End If
On Error GoTo 0

' Start the server with hidden console
Set objProcess = objShell.Exec("cmd /c cd /d """ & strPath & """ && npm run dev")

' Wait a moment then open browser
WScript.Sleep 5000
objShell.Run "start http://localhost:3000", 0, False

' Keep the script running
Do While objProcess.Status = 0
    WScript.Sleep 1000
Loop

WScript.Quit 0
