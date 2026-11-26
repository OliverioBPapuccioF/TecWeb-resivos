// PRODUCTION settings for the DEPLOY (Netlify): used by `ng build` / `npm run build`.
// The other builds replace this file (see "fileReplacements" in angular.json):
//   ng serve                                   -> environment.development.ts
//   ng build --configuration production,docker -> environment.docker.ts (the Docker image)
// The three files must have the same fields.
//
// apiUrl is the ONLY place where the address of the API is written: the services read it
// from here. It is the API deployed on Render (without "/" at the end). The name comes from
// render.yaml (resivos-api): check the real URL in the Render dashboard after creating it.
export const environment = {
  production: true,
  nombreApp: 'Resivos',
  apiUrl: 'https://resivos-api.onrender.com',
};
