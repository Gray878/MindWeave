FROM node:22-alpine

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

# 保持 Next standalone 输出的原始目录层级，避免 server.js 里的相对路径失效
COPY --chown=nextjs:nodejs public ./PandaWiki/web/app/public

# 复制 standalone 构建输出到工作目录
COPY --chown=nextjs:nodejs dist/standalone ./

# 复制静态资源到 standalone 中对应的 dist 目录
COPY --chown=nextjs:nodejs dist/static ./PandaWiki/web/app/dist/static

USER nextjs
EXPOSE 3010
ENV PORT=3010
ENV HOSTNAME="0.0.0.0"

CMD ["node", "PandaWiki/web/app/server.js"]
