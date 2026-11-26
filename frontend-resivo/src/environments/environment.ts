// PRODUCTION settings for the DEPLOY (Netlify): used by `ng build` / `npm run build`.
// The other builds replace this file (see "fileReplacements" in angular.json):
//   ng serve                                   -> environment.development.ts
//   ng build --configuration production,docker -> environment.docker.ts (the Docker image)
// The three files must have the same fields.
//
// nombreApp: name of the app in the menu and in the tab titles. production: true in the
// builds that go to a user (Netlify, Docker), false in ng serve (Angular convention).
//
// apiUrl is the ONLY place where the address of the API is written: the services read it
// from here. It is the API deployed on Render (without "/" at the end): the service
// resivos-api of render.yaml.
export const environment = {
  production: true,
  nombreApp: 'Resivos',
  apiUrl: 'https://resivos-api.onrender.com',
};
