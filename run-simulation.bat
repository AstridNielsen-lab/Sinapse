@echo off
echo 🧠 Iniciando Simulação Neural 3D...
echo.
echo Abrindo simulação no navegador padrão...
echo Para melhor experiência, use Chrome ou Edge.
echo.
echo Pressione Ctrl+C para sair
echo.

REM Try to open with default browser
start "" "index.html"

REM If Python is available, start a simple server
python -c "import webbrowser, http.server, socketserver, threading, time; webbrowser.open('http://localhost:8000'); socketserver.TCPServer(('', 8000), http.server.SimpleHTTPRequestHandler).serve_forever()" 2>nul || (
    REM If Python 3 is not available, try Python 2
    python -m SimpleHTTPServer 8000 2>nul || (
        echo Python não encontrado. Abrindo arquivo diretamente...
        pause
    )
)
