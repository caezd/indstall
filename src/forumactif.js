import { updateProgress } from "./ui.js";

export function createIframe(url, onLoadCallback) {
    let iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.style.display = "none";
    /* iframe.style.width = "100%";
    iframe.style.height = "600px";
    iframe.style.position = "fixed";
    iframe.style.top = "50px";
    iframe.style.left = "50%";
    iframe.style.transform = "translateX(-50%)";
    iframe.style.zIndex = "9999";
    iframe.style.border = "1px solid black"; */
    document.body.appendChild(iframe);

    iframe.onload = () => onLoadCallback(iframe);
    return iframe;
}

export function injectCodeMirrorCSS(iframeDocument, content) {
    let cssTextarea = iframeDocument.querySelector("textarea#edit_code");
    if (!cssTextarea) return;

    let cmInstance = iframeDocument.defaultView.CodeMirror
        ? iframeDocument.defaultView.CodeMirror.fromTextArea(cssTextarea)
        : null;

    if (!cmInstance) return;

    cmInstance.setValue(content);
}

export function injectContent(
    type,
    content,
    updateProgress,
    auth,
    additionalData = {}
) {
    let url;

    switch (type) {
        case "css":
            url = `/admin/?part=themes&sub=logos&mode=css&tid=${auth.tid}&_tc=${auth._tc}`;
            break;
        case "js":
            url = `/admin/index.forum?part=themes&sub=javascript`;
            break;
        case "template":
            if (!additionalData.templateId || !additionalData.layout) {
                console.error(
                    "❌ Informations manquantes pour l'injection de template."
                );
                return;
            }
            url = `/admin/?part=themes&sub=templates&mode=edit_main&t=${additionalData.templateId}&l=${additionalData.layout}&extended_admin=1&tid=${auth.tid}&_t=${auth._tc}`;
            break;
        default:
            console.error(`❌ Type d'injection inconnu : ${type}`);
            return;
    }

    // Vérifier si une iframe pour ce type existe déjà
    let existingIframe = document.getElementById(`iframe-${type}`);
    if (existingIframe) {
        console.log(`⚠️ Une iframe pour ${type} est déjà ouverte. Annulation.`);
        existingIframe.remove();
    }

    let iframe = document.createElement("iframe");
    iframe.id = `iframe-${type}`;
    iframe.src = url;
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    let hasInjected = false;

    iframe.onload = function () {
        if (hasInjected) {
            console.log(`✅ Injection déjà effectuée pour ${type}, on ignore.`);
            return;
        }
        hasInjected = true; // Empêche l'injection multiple

        let iframeDocument =
            iframe.contentDocument || iframe.contentWindow.document;
        let textarea = iframeDocument.querySelector("textarea#edit_code");

        if (!textarea) {
            console.error(`❌ Impossible de trouver l'éditeur pour ${type}.`);
            return;
        }

        // Vérifier si CodeMirror est activé et injecter
        if (type === "css" || type === "template") {
            injectCodeMirrorCSS(iframeDocument, content);
        } else {
            textarea.value = content;
            textarea.dispatchEvent(new Event("input", { bubbles: true }));
        }

        let saveButton = iframeDocument.querySelector("input[type='submit']");
        if (saveButton) {
            console.log(`💾 Sauvegarde automatique du ${type}...`);
            saveButton.click();

            // Observer les changements pour fermer l'iframe une fois la page rechargée
            let observer = new MutationObserver((mutations, obs) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === "childList") {
                        console.log(
                            `✅ Sauvegarde confirmée pour ${type}, fermeture de l'iframe.`
                        );
                        iframe.remove();
                        obs.disconnect();
                        updateProgress(100, `Injection du ${type} terminée.`);
                    }
                });
            });

            observer.observe(iframeDocument.body, {
                childList: true,
                subtree: true,
            });
        } else {
            console.error(`❌ Bouton de validation introuvable pour ${type}.`);
        }
    };
}
