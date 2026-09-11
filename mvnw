#!/bin/sh
# ----------------------------------------------------------------------------
# Maven Wrapper launcher (mvnw)
#
# Baixa o Maven Wrapper oficial (.mvn/wrapper/maven-wrapper.jar) na primeira
# execucao, usando a URL definida em .mvn/wrapper/maven-wrapper.properties,
# e delega para ele. O wrapper, por sua vez, baixa e usa a versao do Maven
# definida em "distributionUrl" no mesmo arquivo — nao é preciso ter o Maven
# instalado na maquina.
# ----------------------------------------------------------------------------
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
WRAPPER_DIR="$DIR/.mvn/wrapper"
WRAPPER_JAR="$WRAPPER_DIR/maven-wrapper.jar"
WRAPPER_PROPERTIES="$WRAPPER_DIR/maven-wrapper.properties"

if [ ! -f "$WRAPPER_PROPERTIES" ]; then
  echo "ERRO: $WRAPPER_PROPERTIES nao encontrado." >&2
  exit 1
fi

if [ ! -f "$WRAPPER_JAR" ]; then
  WRAPPER_URL=$(grep '^wrapperUrl=' "$WRAPPER_PROPERTIES" | cut -d'=' -f2- | tr -d '\r')

  if [ -z "$WRAPPER_URL" ]; then
    echo "ERRO: wrapperUrl nao definido em $WRAPPER_PROPERTIES." >&2
    exit 1
  fi

  mkdir -p "$WRAPPER_DIR"
  echo "Baixando Maven Wrapper de: $WRAPPER_URL"

  if command -v curl >/dev/null 2>&1; then
    curl -fsSL -o "$WRAPPER_JAR" "$WRAPPER_URL"
  elif command -v wget >/dev/null 2>&1; then
    wget -q -O "$WRAPPER_JAR" "$WRAPPER_URL"
  else
    echo "ERRO: curl ou wget sao necessarios para baixar o Maven Wrapper." >&2
    exit 1
  fi
fi

if [ -z "$JAVA_HOME" ]; then
  JAVACMD="java"
else
  JAVACMD="$JAVA_HOME/bin/java"
fi

if ! command -v "$JAVACMD" >/dev/null 2>&1 && [ ! -x "$JAVACMD" ]; then
  echo "ERRO: nao foi possivel encontrar o executavel 'java'. Defina JAVA_HOME ou adicione o Java ao PATH." >&2
  exit 1
fi

exec "$JAVACMD" \
  -classpath "$WRAPPER_JAR" \
  "-Dmaven.multiModuleProjectDirectory=$DIR" \
  org.apache.maven.wrapper.MavenWrapperMain "$@"
