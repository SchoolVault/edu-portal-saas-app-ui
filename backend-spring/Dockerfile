FROM eclipse-temurin:17-jre-alpine AS runtime

WORKDIR /app

COPY target/school-erp-1.0.0.jar app.jar

ENV JAVA_OPTS="-Xmx512m -Xms256m"

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
