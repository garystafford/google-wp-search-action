```bash
export SEARCH_API_HOSTNAME='api.chatbotzlabs.com'
export SEARCH_API_PORT='80'
export SEARCH_API_URL='blog/api/v1/elastic'

node ./index.js
npm run deploy

java -jar -Dspring.profiles.active=gcp search-1.0.1.jar
docker stack deploy -c stack.yml search
docker logs search_elastic_1 --follow
DELETE localhost8681-1/post/2


http://api.chatbotzlabs.com/blog/api/v1/elastic/
http://api.chatbotzlabs.com/blog/api/v1/swagger-ui.html

https://www.thepolyglotdeveloper.com/2017/10/consume-remote-api-data-nodejs-application/
```
