export { createProject, joinProject, getUserProjects } from "./projects";

export async function getUserClasses(userId) {
  return getUserProjects(userId);
}

export async function createClass(userId, name) {
  return createProject(name);
}

export async function joinClass(userId, joinCode) {
  return joinProject(joinCode);
}
