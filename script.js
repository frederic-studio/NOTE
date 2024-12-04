const noteContainer = document.getElementById('note-container');
const noteItems = noteContainer.children;
const commandInput = document.querySelector('#command-search input');
const commandPalette = document.getElementById('command-palette');
const commandPaletteContainer = document.querySelector('#command-container');

const commands = {
    Text: [
        {Name: "Display", Type: "h1", Placeholder: "Type to add a Display", subType: null}, 
        {Name: "Headline", Type: "h2", Placeholder: "Type to add a Headline", subType: null}, 
        {Name: "Subtitle", Type: "h3", Placeholder: "Type to add a Subtitle", subType: null}, 
        {Name: "Paragraph", Type: "p", Placeholder: "Type to add a Paragraph", subType: null}
    ],
    List: [
        {Name: "Ordered", Type: "ol", Placeholder: "Type to add list item", subType: '<li></li>'},
        {Name: "Unordered", Type: "ul", Placeholder: "Type to add list item", subType: '<li></li>'},
        {Name: "Checklist", Type: "form", Placeholder: "Type to add list item", subType: "<label><input type='checkbox'></label>"}
    ],
    Object: [
        {Name: "Image", Type: "img", Placeholder: "Type or paste an image URL", subType: null}, 
        {Name: "Table", Type: "table", Placeholder: "Type to add content to the table", subType: null}, 
        {Name: "Link", Type: "a", Placeholder: "Type or paste a URL", subType: null}
    ]
};

let targetNode;

const commandLookup = new Map();
Object.keys(commands).forEach(category => {
    commands[category].forEach(command => {
        commandLookup.set(command.Type.toLowerCase(), { ...command, category });
    });
});

function findCommandDetail(type, detail = null) {
    const command = commandLookup.get(type.toLowerCase());
    return command ? (detail ? command[detail] : command.category) : null;
}







function addItems(targetNode, newType) {
    let newElement;
    const isInList = findCommandDetail(targetNode.parentNode.tagName.toLowerCase()) === 'List';
    const empty = targetNode.textContent === '';
    
    // If the targetNode is a list item, handle it differently
    if (isInList && !empty) {
        return handleListItems(targetNode);
    } 
    
    if (newType) {
        commandPaletteContainer.hidePopover();
        empty;

        // If the newType is a list, handle it differently
        if (findCommandDetail(newType) === 'List') {
            return handleListItems(targetNode, newType);
        }    
        newElement = document.createElement(newType);
    } else {
        newElement = document.createElement('p');
    }

    // If the targetNode is in a list, insert the newElement after the list
    if (targetNode.parentNode !== noteContainer) {
        targetNode.parentNode.insertAdjacentElement('afterend', newElement);
    } else {
        targetNode.insertAdjacentElement('afterend', newElement);
    }
    newElement.setAttribute('contenteditable', 'true');
    newElement.setAttribute('data-placeholder', findCommandDetail(newElement.tagName.toLowerCase(), 'Placeholder'));
    newElement.focus();
   
    if (empty && targetNode.tagName !== 'P') {
        targetNode.remove();
    }
    return newElement;
}

function handleListItems(targetNode, newType) {
    const listType = newType ? newType.toLowerCase() : targetNode.parentNode.tagName.toLowerCase();
    const subType = findCommandDetail(listType, "subType");
    const listContainer = document.createElement(listType);
    let newElement;

    if(newType) {
        listContainer.innerHTML = subType;
        targetNode.insertAdjacentElement('afterend', listContainer);
        newElement = targetNode.nextElementSibling.childNodes[0];
    } else {
        targetNode.insertAdjacentHTML('afterend', subType);
        newElement = targetNode.nextElementSibling;
    }
    newElement.setAttribute('contenteditable', 'true');
    newElement.setAttribute('data-placeholder', findCommandDetail(newElement.parentNode.tagName.toLowerCase(), 'Placeholder'));
    newElement.focus();
    if (targetNode.tagName !== targetNode.nextElementSibling.tagName) {
        targetNode.remove();
    }
    return newElement
}









function caretPosition(element, action = 'get', position = 0) {
    const selection = window.getSelection();
    const range = document.createRange();

    if (action === 'get') {
        const currentRange = selection.getRangeAt(0);
        currentRange.setStart(element, 0);
        return currentRange.toString().length;
    } else if (action === 'set') {
        if (position === 'start') {
            range.setStart(element, 0);
        } else if (position === 'end') {
            range.selectNodeContents(element);
            range.collapse(false);
        } else {
            range.setStart(element, position);
        }
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

noteContainer.addEventListener('focus', (e) => {
    if (e.target.hasAttribute('contenteditable')) {
        targetNode = e.target;
        e.target.addEventListener('keydown', addEventListener);
        e.target.addEventListener('blur', removeEventListener);
    }
}, true);

function addEventListener(e) {
    if (e.key === "Backspace") {
        if (e.target.textContent.length === 1) {
            e.target.innerHTML = '';
        } else if (e.target.textContent.length === 0 && !e.target.classList.contains('title-page')) {
            if (e.target.tagName !== 'P' && findCommandDetail(e.target.parentNode.tagName.toLowerCase()) !== 'List') {
                addItems(e.target, 'p');
            }
            e.preventDefault();
            handleBackspace(e.target);
        }
    }

    if (e.key === "Enter") {
        e.preventDefault();
        const newElement = addItems(targetNode);
        targetNode = newElement;
    }

    if (e.key === "/") {
        e.preventDefault();
        commandPaletteContainer.showPopover();
        commandInput.focus();
    }
}

function handleBackspace(target) {

    if (target.parentNode && target.parentNode !== noteContainer && target.parentNode.firstElementChild === target) {
        if (target.previousElementSibling) {
            caretPosition(target.previousElementSibling.parentNode, 'set', 'end');
            target.parentNode.previousElementSibling.focus();
        }
        caretPosition(target.parentNode.previousElementSibling, 'set', 'end');
        target.parentNode.previousElementSibling.focus();
        target.parentNode.remove();
    } else {
        let previousElement = target.previousElementSibling;
        if (previousElement && !previousElement.hasAttribute('contenteditable')) {
            previousElement = previousElement.lastElementChild;
        }
        if (previousElement) {
            caretPosition(previousElement, 'set', 'end');
            previousElement.focus();
        }
        target.remove();
    }
}

function removeEventListener(e) {
    e.target.removeEventListener('keydown', addEventListener);
    e.target.removeEventListener('blur', removeEventListener);
}

async function fetchSVG(name) {
    const response = await fetch(`icon/${name}.svg`);
    if (response.ok) {
        return await response.text();
    } else {
        console.error(`Failed to fetch SVG: ${name}`);
        return '';
    }
}

async function populateCommandPalette() {
    for (const category of Object.keys(commands)) {
        const container = document.createElement('div');
        container.classList.add('command-section');
        const header = document.createElement('h4');
        header.textContent = category;
        container.appendChild(header);
        const ul = document.createElement('ul');
        for (const command of commands[category]) {
            const li = document.createElement('li');
            li.classList.add('command-item');
            const svgContent = await fetchSVG(command.Name.toLowerCase());
            li.innerHTML = `
                <button onclick="addItems(targetNode, '${command.Type}')">
                    ${svgContent}
                    <h5>${command.Name}</h5>
                </button>`;
            ul.appendChild(li);
        }
        container.appendChild(ul);
        commandPalette.appendChild(container);
    }
}

// Initialize
populateCommandPalette();
commandInput.addEventListener('blur', (e) => {e.target.value = '';});
