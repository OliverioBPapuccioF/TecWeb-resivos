// PRODUCTION settings: used by `ng build` (and by the Docker image).
// In development (`ng serve`) Angular uses environment.development.ts instead
// (see "fileReplacements" in angular.json). Both files must have the same fields.
//
// apiUrl is the ONLY place where the address of the API is written: the services read it
// from here. For now it is the API on your machine (Docker publishes it on localhost:3000);
// when the app is deployed, put here the real URL of the API (without "/" at the end).
export const environment = {
  production: true,
  nombreApp: 'Resivos',
  apiUrl: 'http://localhost:3000',
};
