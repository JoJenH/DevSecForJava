FROM maven:3.9-eclipse-temurin-17 AS builder

RUN mkdir -p /root/.m2 && \
    echo '<?xml version="1.0" encoding="UTF-8"?>' > /root/.m2/settings.xml && \
    echo '<settings>' >> /root/.m2/settings.xml && \
    echo '  <mirrors>' >> /root/.m2/settings.xml && \
    echo '    <mirror>' >> /root/.m2/settings.xml && \
    echo '      <id>aliyunmaven</id>' >> /root/.m2/settings.xml && \
    echo '      <mirrorOf>*</mirrorOf>' >> /root/.m2/settings.xml && \
    echo '      <name>Aliyun Maven Mirror</name>' >> /root/.m2/settings.xml && \
    echo '      <url>https://maven.aliyun.com/repository/public</url>' >> /root/.m2/settings.xml && \
    echo '    </mirror>' >> /root/.m2/settings.xml && \
    echo '  </mirrors>' >> /root/.m2/settings.xml && \
    echo '</settings>' >> /root/.m2/settings.xml

WORKDIR /build

COPY java/java-vul/ ./

RUN if ls target/*.jar 1>/dev/null 2>&1; then \
        echo "Using existing jar, skipping build"; \
    else \
        echo "Building from source..."; \
        mvn dependency:go-offline -B && \
        mvn package -DskipTests -B; \
    fi

FROM eclipse-temurin:17-jre

RUN groupadd -g 1000 appgroup && \
    useradd -u 1000 -g appgroup -m -s /bin/bash appuser

WORKDIR /app

COPY --from=builder /build/target/*.jar app.jar

RUN chown -R appuser:appgroup /app

USER appuser

ENV SERVER_PORT=8081

EXPOSE 8081

CMD ["java", "-jar", "app.jar"]
