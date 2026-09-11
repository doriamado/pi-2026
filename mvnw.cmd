@echo off
setlocal

set "DIR=%~dp0"
set "WRAPPER_DIR=%DIR%.mvn\wrapper"
set "WRAPPER_JAR=%WRAPPER_DIR%\maven-wrapper.jar"
set "WRAPPER_PROPERTIES=%WRAPPER_DIR%\maven-wrapper.properties"

if not exist "%WRAPPER_PROPERTIES%" (
  echo ERRO: %WRAPPER_PROPERTIES% nao encontrado. 1>&2
  exit /b 1
)

if not exist "%WRAPPER_JAR%" (
  set "WRAPPER_URL="
  for /f "usebackq tokens=1,* delims==" %%A in ("%WRAPPER_PROPERTIES%") do (
    if "%%A"=="wrapperUrl" set "WRAPPER_URL=%%B"
  )

  if not defined WRAPPER_URL (
    echo ERRO: wrapperUrl nao definido em %WRAPPER_PROPERTIES%. 1>&2
    exit /b 1
  )

  if not exist "%WRAPPER_DIR%" mkdir "%WRAPPER_DIR%"
  echo Baixando Maven Wrapper de: %WRAPPER_URL%

  powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri '%WRAPPER_URL%' -OutFile '%WRAPPER_JAR%'"
  if errorlevel 1 (
    echo ERRO: falha ao baixar o Maven Wrapper. 1>&2
    exit /b 1
  )
)

if defined JAVA_HOME (
  set "JAVACMD=%JAVA_HOME%\bin\java.exe"
) else (
  set "JAVACMD=java.exe"
)

"%JAVACMD%" -classpath "%WRAPPER_JAR%" "-Dmaven.multiModuleProjectDirectory=%DIR%" org.apache.maven.wrapper.MavenWrapperMain %*
