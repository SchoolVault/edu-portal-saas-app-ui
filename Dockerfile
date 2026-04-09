# Monorepo root — Render: Root Directory empty, Dockerfile Path = Dockerfile
# linux/amd64: matches Render hosts; avoids arm64 images built on Apple Silicon.

FROM --platform=linux/amd64 maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY backend-spring/pom.xml .
COPY backend-spring/src ./src
RUN mvn -B -DskipTests package

FROM --platform=linux/amd64 eclipse-temurin:17-jre-jammy AS runtime
WORKDIR /app
COPY --from=build /build/target/school-erp-1.0.0.jar app.jar
ENV JAVA_OPTS="-Xmx512m -Xms256m"
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
