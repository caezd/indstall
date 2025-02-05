import { Encode, Fetcher } from "./utils.js";

import templatesData from "../templates.json";

const LOCATION = new URL(window.location);
const ROOT = `${LOCATION.protocol}//${LOCATION.host}`;

let auth;

export async function startInstallation(updateProgress) {
    updateProgress(0, "Vérification des droits d'administration...");
    console.log(templatesData);

    auth = await fetch(ROOT)
        .then((res) => res.text())
        .then((res) => {
            const parser = new DOMParser();
            const htmlDocument = parser.parseFromString(res, "text/html");
            const admin_link = htmlDocument.querySelector('a[href^="/admin/"]');
            if (!admin_link) return false;

            const url = new URLSearchParams(admin_link.href);
            return {
                tid: url.get("tid"),
                _tc: url.get("_tc"),
            };
        });

    if (!auth) throw "must be logged and admin";

    try {
        updateProgress(5, "Récupération des fichiers du Blank Theme...");

        const githubRepo =
            "https://api.github.com/repos/Kim-Bnx/Blank-Theme/contents/";
        let response = await fetch(githubRepo);
        let files = await response.json();

        let totalTasks = files.filter(
            (file) =>
                file.name.endsWith(".css") ||
                file.name.endsWith(".js") ||
                file.name.endsWith(".html")
        ).length;
        let completedTasks = 0;

        function updateTaskStatus(taskMessage) {
            completedTasks++;
            let progress = Math.round((completedTasks / totalTasks) * 100);
            updateProgress(progress, taskMessage);
        }

        // Installation du CSS
        let cssFile = files.find((file) => file.name.endsWith(".css"));
        if (cssFile) {
            let cssContent = await fetch(cssFile.download_url).then((res) =>
                res.text()
            );
            await injectCSS(cssContent, updateTaskStatus);
        }

        // Installation des fichiers JS
        let jsFiles = files.filter((file) => file.name.endsWith(".js"));
        for (let jsFile of jsFiles) {
            let jsContent = await fetch(jsFile.download_url).then((res) =>
                res.text()
            );
            await injectJS(jsContent, jsFile.name, updateTaskStatus);
        }

        // Installation des fichiers templates
        let templateFiles = files.filter((file) => file.name.endsWith(".html"));
        for (let templateFile of templateFiles) {
            let templateContent = await fetch(templateFile.download_url).then(
                (res) => res.text()
            );
            await injectTemplate(
                templateFile.name,
                templateContent,
                updateTaskStatus
            );
        }

        updateProgress(100, "Installation terminée !");
    } catch (error) {
        updateProgress(100, "Erreur lors de l'installation !");
        console.error(error);
    }
}

// Injecter le CSS dans le panneau d'admin
async function injectCSS(cssCode, updateStatus) {
    updateStatus("Injection du CSS...");

    let iframe = createIframe(
        `/admin/?part=themes&sub=logos&mode=css${
            auth.tid ? `&tid=${auth.tid}` : ""
        }${auth._tc ? `&_tc=${auth._tc}` : ""}`
    );

    let hasExecuted = false;

    iframe.onload = function () {
        console.log("✅ Iframe chargée, injection du CSS...");
        if (hasExecuted) {
            console.log("✅ Action déjà exécutée, on stoppe ici.");
            return;
        }
        hasExecuted = true; // Marquer que l'action a déjà été effectuée

        let iframeDocument =
            iframe.contentDocument || iframe.contentWindow.document;

        let cssTextarea = iframeDocument.querySelector(
            ".CodeMirror textarea[style]"
        );
        if (!cssTextarea) {
            console.error(
                "❌ Impossible de trouver l'éditeur de CSS dans l'iframe !"
            );
            return;
        }

        // Insérer le CSS
        console.log("✏️ Injection du CSS...");
        injectCodeMirrorCSS(iframeDocument, cssCode);

        // Trouver et cliquer sur "Valider" pour sauvegarder
        let saveButton = iframeDocument.querySelector("input[name='submit']");
        if (saveButton) {
            console.log("💾 Sauvegarde automatique...");
            saveButton.click();
        } else {
            console.error("❌ Bouton de validation introuvable !");
        }
    };
}

// Injecter un script JS
async function injectJS(jsCode, fileName, updateStatus) {
    updateStatus(`Injection du script ${fileName}...`);
    await fetch(
        window.location.origin +
            "/admin/index.forum?part=themes&sub=javascript",
        {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body:
                "js_code=" + encodeURIComponent(jsCode) + "&submit=Enregistrer",
        }
    );
}

// Injecter un fichier de template HTML
async function injectTemplate(templateName, templateCode, updateStatus) {
    updateStatus(`Mise à jour du template ${templateName}...`);
    await fetch(
        window.location.origin +
            `/admin/index.forum?part=themes&sub=templates&template=${templateName}`,
        {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body:
                "template_code=" +
                encodeURIComponent(templateCode) +
                "&submit=Enregistrer",
        }
    );
}

function createIframe(url) {
    let iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.style.width = "100%";
    iframe.style.height = "600px"; // Permet de voir si tout se charge bien (peut être caché ensuite)
    iframe.style.position = "fixed";
    iframe.style.top = "50px";
    iframe.style.left = "50%";
    iframe.style.transform = "translateX(-50%)";
    iframe.style.zIndex = "9999";
    iframe.style.border = "1px solid black";
    document.body.appendChild(iframe);
    return iframe;
}

function pasteIntoTextarea(iframeDocument, text) {
    let cssTextarea = iframeDocument.querySelector("textarea#edit_code");
    if (!cssTextarea) {
        console.error("❌ Impossible de trouver l'éditeur de CSS !");
        return;
    }

    // Mettre le texte dans le presse-papiers
    navigator.clipboard
        .writeText(text)
        .then(() => {
            console.log("📋 CSS copié dans le presse-papiers !");

            // Focaliser le champ
            cssTextarea.focus();

            // Simuler Ctrl + V pour coller
            let pasteEvent = new ClipboardEvent("paste", {
                clipboardData: new DataTransfer(),
            });
            pasteEvent.clipboardData.setData("text/plain", text);
            cssTextarea.dispatchEvent(pasteEvent);

            console.log("✅ CSS collé dans l'éditeur !");
        })
        .catch((err) => {
            console.error("❌ Erreur lors de la copie du CSS :", err);
        });
}

function injectCodeMirrorCSS(iframeDocument, cssCode) {
    // Trouver l'élément textarea d'origine
    let cssTextarea = iframeDocument.querySelector("textarea#edit_code");
    if (!cssTextarea) {
        console.error("❌ Impossible de trouver l'éditeur de CSS !");
        return;
    }

    // Vérifier si CodeMirror est bien activé
    let cmInstance = iframeDocument.defaultView.CodeMirror
        ? iframeDocument.defaultView.CodeMirror.fromTextArea(cssTextarea)
        : null;

    if (!cmInstance) {
        console.error("❌ Impossible de trouver l'instance CodeMirror !");
        return;
    }

    // Insérer le CSS dans CodeMirror via son API
    cmInstance.setValue(cssCode);
    console.log("✅ CSS injecté dans CodeMirror !");
}
