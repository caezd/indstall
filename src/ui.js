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
        #blankThemeInstaller {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }
        #installerContent {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            max-width: 400px;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
        }
        #progressContainer {
            width: 100%;
            height: 10px;
            background: #e0e0e0;
            border-radius: 5px;
            margin-top: 15px;
            overflow: hidden;
            position: relative;
        }
        #progressBar {
            width: 0%;
            height: 100%;
            background: #28a745;
            transition: width 0.3s ease-in-out;
        }
        #statusMessage {
            margin-top: 10px;
            font-size: 14px;
            color: #333;
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(installerContainer);

    document
        .getElementById("closeInstaller")
        .addEventListener("click", function () {
            installerContainer.remove();
            style.remove();
        });

    document
        .getElementById("installButton")
        .addEventListener("click", function () {
            document.getElementById("statusMessage").innerText =
                "Début de l'installation...";
            startInstallation(updateProgress);
        });
}

function updateProgress(percentage, status) {
    document.getElementById("progressBar").style.width = percentage + "%";
    document.getElementById("statusMessage").innerText = status;
}
