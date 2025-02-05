const GITHUB_BASE_URL =
    "https://api.github.com/repos/Kim-Bnx/Blank-Theme/contents";

export async function fetchFilesFromGitHub(path) {
    let response = await fetch(`${GITHUB_BASE_URL}/${path}`);
    console.log(response);
    return response.ok ? await response.json() : [];
}

export async function fetchFileContent(url) {
    let response = await fetch(url);
    return response.ok ? await response.text() : null;
}
