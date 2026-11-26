// PRODUCTION settings for the DOCKER image (make levantar): a production build, but the API
// is the one of docker-compose, published on your machine (the code runs in the browser,
// so it reaches the API by localhost). Used by `ng build --configuration production,docker`
// (frontend-resivo/Dockerfile). The three environment files must have the same fields.
export const environment = {
  production: true,
  nombreApp: 'Resivos',
  apiUrl: 'http://localhost:3000',
};
