import { startInstallation } from "./installer.js";

export function createInstallerUI() {
    if (document.getElementById("blankThemeInstaller")) return;

    let installerContainer = document.createElement("div");
    installerContainer.id = "blankThemeInstaller";
    installerContainer.innerHTML = `
        <div id="installerContent">
            <h1>Installer le Blank Theme</h1>
            <p>Ce processus remplacera le thème actuel de votre forum par le Blank Theme.</p>
            <button id="installButton">Installer maintenant</button>
            <button id="closeInstaller">Annuler</button>
            <p id="statusMessage">Prêt à installer</p>
            <div id="progressContainer">
                <div id="progressBar"></div>
            </div>
        </div>
    `;

    let style = document.createElement("style");
    style.innerHTML = `
        #progressContainer { width: 100%; height: 10px; background: #e0e0e0; border-radius: 5px; margin-top: 15px; }
        #progressBar { width: 0%; height: 100%; background: #28a745; transition: width 0.3s ease-in-out, background 0.3s ease-in-out; }
        .progress-error { background: #dc3545 !important; }
        #installButton:disabled { background: #b5b5b5; cursor: not-allowed; }
    `;

    document.head.appendChild(style);
    document.body.appendChild(installerContainer);

    const installButton = document.getElementById("installButton");

    installButton.addEventListener("click", () => {
        installButton.disabled = true; // Désactiver le bouton une fois l'installation commencée
        document.getElementById("statusMessage").innerText =
            "Début de l'installation...";
        startInstallation(updateProgress, () => {
            installButton.disabled = false; // Réactiver le bouton si l'installation échoue
        });
    });

    document.getElementById("closeInstaller").addEventListener("click", () => {
        installerContainer.remove();
        style.remove();
    });
}

export function updateProgress(percentage, status, isError = false) {
    let progressBar = document.getElementById("progressBar");
    let statusMessage = document.getElementById("statusMessage");

    progressBar.style.width = percentage + "%";
    statusMessage.innerText = status;

    if (isError) {
        progressBar.classList.add("progress-error");
        statusMessage.style.color = "red";
        document.getElementById("installButton").disabled = false; // Réactiver le bouton en cas d'erreur
    }
}
