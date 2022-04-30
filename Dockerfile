FROM alpine:latest

RUN apk update
RUN apk add maven

WORKDIR /app
COPY . .

CMD ["mvn", "spring-boot:run"]
EXPOSE 8080
