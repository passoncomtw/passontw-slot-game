FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata bash curl jq
WORKDIR /root/

COPY ./bin/app-linux-amd64 .

RUN echo '#!/bin/bash' > /root/start.sh && \
    echo 'export TZ=Asia/Taipei' >> /root/start.sh && \
    echo 'export APP_ENV=${APP_ENV:-production}' >> /root/start.sh && \
    echo './app-linux-amd64' >> /root/start.sh && \
    chmod +x /root/start.sh

ENV APP_ENV=production \
    TZ=Asia/Taipei
    
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD curl -f http://localhost:8080/health || exit 1
CMD ["/bin/bash", "/root/start.sh"]