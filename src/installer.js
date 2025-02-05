import { fetchFilesFromGitHub, fetchFileContent } from "./github.js";
import { injectContent } from "./forumactif.js";
import templatesData from "../templates.json";

const LOCATION = new URL(window.location);
const ROOT = `${LOCATION.protocol}//${LOCATION.host}`;
let auth;

export async function startInstallation(updateProgress, onErrorCallback) {
    updateProgress(0, "Vérification des droits d'administration...");

    try {
        auth = await fetch(ROOT)
            .then((res) => res.text())
            .then((res) => {
                const parser = new DOMParser();
                const htmlDocument = parser.parseFromString(res, "text/html");
                const adminLink =
                    htmlDocument.querySelector('a[href^="/admin/"]');
                if (!adminLink) throw "Accès administrateur requis.";

                const url = new URLSearchParams(adminLink.href);
                return { tid: url.get("tid"), _tc: url.get("_tc") };
            });

        if (!auth) throw "Droits administrateur insuffisants.";
    } catch (error) {
        updateProgress(100, "Erreur : " + error, true);
        return;
    }

    try {
        updateProgress(5, "Récupération des fichiers du Blank Theme...");

        let cssFiles = await fetchFilesFromGitHub("CSS");
        let jsFiles = await fetchFilesFromGitHub("Javascript");
        let templateLayouts = await fetchFilesFromGitHub("Templates");

        let totalTasks =
            cssFiles.length + jsFiles.length + templateLayouts.length;
        let completedTasks = 0;

        async function updateTaskStatus(taskMessage) {
            completedTasks++;
            let progress = Math.round((completedTasks / totalTasks) * 100);
            updateProgress(progress, taskMessage);
        }
        let processedFiles = new Set();

        if (cssFiles.length > 0) {
            let cssFile = cssFiles.find((file) => file.name.endsWith(".css"));
            if (cssFile && !processedFiles.has(cssFile.name)) {
                let content = await fetchFileContent(cssFile.download_url);
                await injectContent("css", content, updateTaskStatus, auth);
                processedFiles.add(cssFile.name);
            }
        }

        /* for (let file of jsFiles) {
            let content = await fetchFileContent(file.download_url);
            await injectContent("js", content, updateTaskStatus, auth);
        }

        for (let layout of templateLayouts) {
        let capitalizedLayout = capitalize(layout.name);
            let templateFiles = await fetchFilesFromGitHub(`Templates/${capitalizedLayout}`);
            for (let file of templateFiles) {
                let templateInfo = findTemplateInfo(
                    layout.name,
                    file.name.replace(".tpl", "")
                );
                if (templateInfo) {
                    let content = await fetchFileContent(file.download_url);
                    await injectContent(
                        "template",
                        content,
                        updateTaskStatus,
                        auth,
                        {
                            templateId: templateInfo.id,
                            layout: layout.name,
                        }
                    );
                }
            }
        } */

        updateProgress(100, "Installation terminée !");
    } catch (error) {
        updateProgress(100, "Erreur lors de l'installation !", true);
        console.error(error);
    }
}

function findTemplateInfo(layout, name) {
    let layoutData = templatesData.find((l) => l.layout === layout);
    return layoutData?.templates.find((t) => t.name === name) || null;
}

/*
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

function injectCodeMirrorCSS(iframeDocument, cssCode) {
    // Trouver l'élément textarea d'origine
    let cssTextarea = iframeDocument.querySelector("textarea#edit_code");
    if (!cssTextarea) {
        
        return;
    }

    // Vérifier si CodeMirror est bien activé
    let cmInstance = iframeDocument.defaultView.CodeMirror
        ? iframeDocument.defaultView.CodeMirror.fromTextArea(cssTextarea)
        : null;

    if (!cmInstance) {
        
        return;
    }

    // Insérer le CSS dans CodeMirror via son API
    cmInstance.setValue(cssCode);
}
*/
