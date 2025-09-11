@echo off
echo ========================================
echo   Sistema de Contratacoes - BUILD EXE
echo ========================================
echo.

echo [1/4] Ativando ambiente virtual...
call "venv\Scripts\activate.bat"
if errorlevel 1 (
    echo ERRO: Falha ao ativar o ambiente virtual
    pause
    exit /b 1
)

echo [2/4] Limpando builds anteriores...
if exist "build" rmdir /s /q "build"
if exist "dist" rmdir /s /q "dist"
if exist "*.spec~" del "*.spec~"

echo [3/4] Construindo executável...
pyinstaller sistema_contratacoes.spec --clean --noconfirm
if errorlevel 1 (
    echo ERRO: Falha na construção do executável
    pause
    exit /b 1
)

echo [4/4] Build concluído!
echo.
echo ========================================
echo   EXECUTÁVEL CRIADO COM SUCESSO!
echo ========================================
echo Localização: .\dist\SistemaContratacoes.exe
echo.
echo INSTRUÇÕES DE USO:
echo 1. Copie o arquivo .exe para onde desejar
echo 2. Certifique-se de que o PostgreSQL esteja rodando
echo 3. Execute o .exe
echo 4. Acesse: http://localhost:8000
echo.
echo Para conectar ao seu banco PostgreSQL:
echo - Host: localhost (ou IP do seu servidor)
echo - Porta: 5432
echo - Database: sistema_contratacoes
echo - User: postgres
echo - Password: 123
echo.
echo Pressione qualquer tecla para sair...
pause >nul