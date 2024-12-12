const body = document.body;
const menu_area = document.createElement('div');
const menu_pages = document.createElement('div');
const menu_page = document.createElement('div');
menu_page.classList.add('menu_page');
menu_area.classList.add('menu_area');
// Build page menu
// Update page menu
// Submenu
menu_area.append(menu_pages, menu_page);
body.prepend(menu_area);
// @ts-ignore
import content from "!!raw-loader!/content.txt";
import { rootdir } from "./code/playground-area/PlaygroundArea";
function buildPagesMenu(content) {
    const root = {
        target: "/",
        level: 1,
        parent: null,
        children: []
    };
    const current = new Array();
    current[1] = root;
    for (let item of content.split("\n")) {
        const offset = item.indexOf('-');
        const level = offset / 4 + 2;
        const sep = item.indexOf(":");
        const target = item.slice(offset + 2, sep);
        const text = item.slice(sep + 1);
        const parent = current[level - 1];
        const node = {
            text,
            target,
            level,
            parent,
            children: []
        };
        parent.children.push(node);
        current[level] = node;
    }
    return root;
}
function buildPageMenu(parent = null) {
    const root = {
        target: document.querySelector('h1'),
        level: 1,
        parent: null,
        children: []
    };
    let curpos = root;
    const titles = document.querySelectorAll("h2, h3, h4");
    for (let title of titles) {
        const level = +title.tagName.slice(1);
        while (level <= curpos.level)
            curpos = curpos.parent;
        const elem = {
            target: title,
            level,
            children: [],
            parent: curpos
        };
        curpos.children.push(elem);
        curpos = elem;
    }
    return root;
}
function searchCurPageHeader(htree, position) {
    const headers = htree.children;
    for (let i = headers.length - 1; i >= 0; --i) {
        if (headers[i].target.offsetTop <= position + 2.5 * 14 + 5)
            return searchCurPageHeader(headers[i], position) ?? headers[i];
    }
    return null;
}
function searchCurPagesHeader(htree) {
    console.warn(rootdir, window.location.pathname);
    return null;
}
const pages = buildPagesMenu(content); //TODO
searchCurPagesHeader(pages);
const hid = [
    [],
    ["I", "II", "III", "IV"],
    ["1", "2", "3", "5", "6", "7", "8", "9"],
    ["a", "b", "c", "d", "e", "f", "g", "h"],
];
function getTitlePrefix(s) {
    if (s.level >= hid.length)
        return "";
    let idx = 1; //TODO...
    if (s.parent !== null)
        idx = s.parent.children.indexOf(s);
    const num = hid[s.level][idx];
    return `${num}. `;
}
function buildMenu(nodes) {
    const menu = document.createElement("div");
    menu.classList.add("menu");
    menu.append(...nodes.map((s, idx) => {
        const item = document.createElement("a");
        item.textContent = `${getTitlePrefix(s)}${s.target.textContent}`;
        item.setAttribute("href", `#${s.target.id}`);
        return item;
    }));
    return menu;
}
function updatePageMenu() {
    //TODO: scale...
    let last = searchCurPageHeader(menu, document.documentElement.scrollTop);
    let headers = [];
    let cursor = last;
    if (last === null)
        cursor = last = menu;
    while (cursor !== null) {
        headers.push(cursor);
        cursor = cursor.parent;
    }
    const html = headers.reverse().map((hnode, i) => {
        const h = hnode.target;
        const h_html = document.createElement("span");
        const link = document.createElement("a");
        link.textContent = `${getTitlePrefix(hnode)}${h.textContent}`;
        link.setAttribute('href', `#${h.id}`);
        h_html.append(link);
        if (hnode.parent !== null) {
            const menu = buildMenu(hnode.parent.children);
            h_html.append(menu);
        }
        return h_html;
    });
    if (last !== null && last.children.length !== 0) {
        const empty = document.createElement("span");
        empty.append(buildMenu(last.children));
        html.push(empty);
    }
    /*
    function make_page_href(pathprefix: string, path: string, desc: any) {

        // h4ck...
        if( path[0] === "/" )
            throw new Error('not implemented');
            //return `${root_path.slice(0,-6)}/${path}`;

        let href = `${pathprefix}${path}/`;

        while(desc.children?.length) {
            desc = desc.children[0];
            href += `${desc.path ?? desc}/`;
        }

        return href;
    }

    /*
    function make_page_menu(pathprefix: string, path: string, pages: any) {
        const desc = pages.find( (page: any) => page === path || page.path === path )!;
        
        const html = document.createElement("span");
        {
            const link = document.createElement("a");
            link.textContent = desc.sname ?? desc.name ?? desc;
            link.setAttribute('href', make_page_href(pathprefix, path, desc) );
    
            const menu = document.createElement("div");
            menu.classList.add("menu");
    
            menu.append( ... pages.map( (page:any) => {
                const item = document.createElement("a");
                item.textContent= page.name ?? page;

                item.setAttribute("href", make_page_href(pathprefix, page.path??page, page) );
                return item;
            }) );
    
            html.append(link, menu);
        }

        return html;
    }
    let curpage = window.location.pathname.slice(root_path.length).split('/');

    const module_html = make_page_menu(root_path, curpage[0], pages);

    const desc = pages.find( (page: any) => page.path === curpage[0] )!;
    const type_html   = make_page_menu(root_path + curpage[0] + "/", curpage[1], desc.children);

    const desc_type = desc.children.find( (page: any) => (page?.path ?? page) === curpage[1] )!;
    if( typeof desc_type !== "string") {
        // title num
        const desc2_idx = desc_type.children.findIndex( (page: any) => page?.path ?? page === curpage[2] )!;
        document.body.style.setProperty("--header_start_id", `${desc2_idx}`);
        // menu
        const session_html   = make_page_menu(root_path + curpage[0] + "/"+ curpage[1] + "/", curpage[2], desc_type.children);
        html[0] = session_html;
    }*/
    // module_html, type_html,
    menu_page.replaceChildren(...html);
}
const menu = buildPageMenu();
window.addEventListener('scroll', updatePageMenu);
updatePageMenu();
//# sourceMappingURL=menu.js.map