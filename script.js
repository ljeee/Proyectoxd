// SPA: Navegación desde el botón Crear Feature en Sprint
document.addEventListener("click", function(e) {
  if (e.target && e.target.id === "create-feature-button" && document.getElementById("kanban-board")) {
    e.preventDefault();
    navigate("/crearfetaure");
  }
});

// SPA: Manejo del formulario de crear feature
document.addEventListener("submit", async function(e) {
      if (e.target && e.target.id === "feature-form") {
        e.preventDefault();
        const title = document.getElementById("feature-title").value.trim();
        const description = document.getElementById("feature-description").value.trim();
        const assigned = document.getElementById("feature-assigned").value.trim();
        if (!title) return alert("El título es obligatorio");
        // Obtener el último id
        const tasks = await fetch("http://localhost:3000/sprintTasks").then(r => r.json());
        const newId = tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
        await fetch("http://localhost:3000/sprintTasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: newId, title, description, assigned, status: "feature" })
        });
        navigate("/sprint");
      }
});
// --- KANBAN SPRINT ---
async function getSprintTasks() {
  const res = await fetch("http://localhost:3000/sprintTasks");
  return await res.json();
}

async function updateSprintTaskStatus(id, newStatus) {
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) return;
  const tasks = await getSprintTasks();
  const task = tasks.find(t => t.id === numId);
  if (!task) {
    alert(`No se encontró la tarea con id ${numId} en la base de datos.`);
    return;
  }
  // Usar PUT para reemplazar el objeto completo (json-server a veces requiere esto)
  const updatedTask = { ...task, status: newStatus };
  await fetch(`http://localhost:3000/sprintTasks/${numId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedTask)
  });
}

function renderKanbanTask(task) {
  const div = document.createElement("div");
  div.className = "kanban-task";
  div.draggable = true;
  div.innerHTML = `<strong>${task.title}</strong>`;
  if (task.description) div.innerHTML += `<div>${task.description}</div>`;
  if (task.assigned) div.innerHTML += `<div><em>Asignado:</em> ${task.assigned}</div>`;
  div.dataset.id = task.id;
  div.addEventListener("dragstart", (e) => {
    div.classList.add("dragging");
    e.dataTransfer.setData("text/plain", task.id);
  });
  div.addEventListener("dragend", () => {
    div.classList.remove("dragging");
  });
  return div;
}

async function renderKanban() {
  const tasks = await getSprintTasks();
  const columns = {
    feature: document.getElementById("feature-tasks"),
    todo: document.getElementById("todo-tasks"),
    inprogress: document.getElementById("inprogress-tasks"),
    done: document.getElementById("done-tasks")
  };
  Object.values(columns).forEach(col => col.innerHTML = "");
  tasks.forEach(task => {
    const col = columns[task.status];
    if (col) col.appendChild(renderKanbanTask(task));
  });
}

function setupKanbanDragAndDrop() {
  document.querySelectorAll(".kanban-tasks").forEach(col => {
    col.addEventListener("dragover", (e) => {
      e.preventDefault();
      col.classList.add("dragover");
    });
    col.addEventListener("dragleave", () => {
      col.classList.remove("dragover");
    });
    col.addEventListener("drop", async (e) => {
      e.preventDefault();
      col.classList.remove("dragover");
      const taskId = e.dataTransfer.getData("text/plain");
      // El status está en el atributo data-status del padre de la columna
      const newStatus = col.parentElement.getAttribute("data-status");
      if (!taskId || !newStatus) return;
      await updateSprintTaskStatus(taskId, newStatus);
      await renderKanban();
      setupKanbanDragAndDrop(); // Reasignar eventos tras re-render
    });
  });
}

async function renderSprints() {
  await renderKanban();
  setupKanbanDragAndDrop();
}

import { getClanes } from "./scripts/services";

// Definición de rutas de la SPA
const routes = {
  "/login": "/",
  "/celulas": "/spa/celula.html",
  "/clanes": "/spa/clanes.html",
  "/sprint": "/spa/sprint.html",
  "/crearfetaure": "/spa/crearfeature.html"
};

async function navigate(pathname) {
  const route = routes[pathname];
  if (route) {
    // Carga el HTML de la ruta
    const html = await fetch(route).then((res) => res.text());
    document.getElementById("content").innerHTML = html;
    history.pushState({}, "", pathname);

    // Inicializa la vista correspondiente
    if (pathname === "/clanes") renderClanes && renderClanes();
    if (pathname === "/celulas") renderCelulas && renderCelulas();
    if (pathname === "/sprint") renderSprints && renderSprints();
  } else {
    // Si la ruta no existe, muestra mensaje de página no encontrada
    document.getElementById("content").innerHTML =
      "<h2>Página no encontrada</h2><p>La ruta solicitada no existe.</p>";
    history.pushState({}, "", pathname);
  }
}

// Maneja la navegación SPA al hacer clic en enlaces con data-link
document.body.addEventListener("click", (e) => {
  if (e.target.matches("[data-link]")) {
    e.preventDefault();
    const path = e.target.getAttribute("href");
    navigate(path);
  }
});

async function renderClanes() {
    let containerClanes = document.getElementById("container-clanes");
    let data = await getClanes();
    containerClanes.innerHTML = "";
    data.forEach((clan) => {
      let div = document.createElement("div");
      div.className = "clan";
      div.innerHTML = `
            <h3>${clan.nombre}</h3>
        `;
      div.style.cursor = "pointer";
      div.addEventListener("click", () => {
        navigate("/celulas");
      });
      containerClanes.appendChild(div);
    });
}

async function renderCelulas() {
    let containerCelulas = document.getElementById("container-celulas");
    // Obtener los clanes y buscar el que tiene celulas (ejemplo: Linus)
    let data = await getClanes();
    let linus = data.find(clan => clan.nombre === "Linus");
    containerCelulas.innerHTML = "";
    if (linus && linus.celulas) {
        linus.celulas.forEach((celula) => {
            let div = document.createElement("div");
            div.className = "clan";
            div.innerHTML = `
                <h3>${celula.nombre}</h3>
            `;
            div.style.cursor = "pointer";
            div.addEventListener("click", () => {
              navigate("/sprint");
            });           
            containerCelulas.appendChild(div);
        });
    }
}
