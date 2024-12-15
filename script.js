const noteContainer = document.getElementById('note-container');
const commandInput = document.getElementById('command-input');
const commandPalette = document.getElementById('command-palette');
const commandPaletteContainer = document.querySelector('#command-container');
let targetNode;

const commands = {
    Text: [
        {Name: "display", Type: "h1"}, 
        {Name: "headline", Type: "h2"}, 
        {Name: "subtitle", Type: "h3"}, 
        {Name: "paragraph", Type: "p"}
    ],
    List: [
        {Name: "ordered", Type: "ol"},
        {Name: "unordered", Type: "ul"},
        {Name: "checklist", Type: "form"}
    ],
    Object: [
        {Name: "image", Type: "img"}, 
        {Name: "table", Type: "table"}, 
        {Name: "link", Type: "a"}
    ]
};


const commandLookup = new Map();
Object.keys(commands).forEach(category => {
    commands[category].forEach(command => {
        commandLookup.set(command.Name, { ...command, category });
    });
});

function getCommandDetail(name, detail = null) {
    const command = commandLookup.get(name);
    return command ? (detail ? command[detail] : command.category) : null;
}

function addItems(targetNode, newType) {
    commandPaletteContainer.hidePopover();
    let item = newType || targetNode.getAttribute('data-name');
    let itemCategory = getCommandDetail(item, 'category');
    return handleItemCategory(itemCategory, targetNode, newType);
}

function handleItemCategory(itemCategory, targetNode, newType) {
    switch (itemCategory) {
        case 'Text': return addText(targetNode, newType);
        case 'List': return addList(targetNode, newType);
        case 'Object': return addObject(targetNode, newType);
        default: 
            console.error(`Unknown category: ${itemCategory}`);
            return null;
    }
}

function addText(targetNode, newType) {
    let newElement = document.createElement(getCommandDetail(newType, 'Type') || 'p');
    let placeholder = newElement.tagName === 'P' ? 
    'Type to add a paragraph or press "/" to add a different component' :
    `Type to add a ${newType}`;
    const ancestor = targetNode.closest('#note-container > *');
    ancestor.insertAdjacentElement('afterend', newElement) || targetNode.insertAdjacentElement('afterend', newElement);
    newElement.setAttribute('contenteditable', 'true');
    newElement.setAttribute('data-name', newType || 'paragraph');
    newElement.setAttribute('data-placeholder', placeholder);
    newElement.focus();
    removeEmptyNode(targetNode, newType);
    return newElement;
}

function addList(targetNode, newType) {
    let newItem = newType || targetNode.getAttribute('data-name');
    let template = document.getElementById(`template-${newItem}`);
    let clone = template.content.cloneNode(true);
    let newElement;

    if (newType) {
        newElement = clone.firstElementChild;
        const ancestor = targetNode.closest('#note-container > *');
        ancestor.insertAdjacentElement('afterend', newElement) || targetNode.insertAdjacentElement('afterend', newElement);
        removeEmptyNode(targetNode, newType);
    } else if (!targetNode.textContent) {
        return addItems(targetNode, 'paragraph');
    } else {
        let e = clone.firstElementChild.children[0];
        targetNode.parentNode.closest(`[data-name='${newItem}']`).appendChild(e);
        newElement = e.querySelector('[contenteditable]') || e;
    }

    newElement.hasAttribute('contenteditable') 
        ? newElement.focus() 
        : newElement.querySelector('[contenteditable]').focus();
    return newElement;
}



function removeEmptyNode(targetNode, newType) {
    if (targetNode.textContent.length === 0 && !targetNode.classList.contains('title-page') && newType) {
        let ancestor = targetNode.parentNode.closest(`[data-name="${targetNode.getAttribute('data-name')}"]`);
        if (targetNode.parentNode === noteContainer) {
            targetNode.remove();
        } else if (ancestor) {
            let childToRemove = Array.from(ancestor.children).find(child => child.contains(targetNode));
            if (childToRemove) {
                if (ancestor.children.length > 1) {
                    childToRemove.remove();
                } else {
                    ancestor.remove();
                }
            }
        }
    }  
}


function handleBackspace(target) {
    let newElement;
    let targetParent = target.parentNode.closest(`[data-name='${target.getAttribute('data-name')}']`);


    if (target.previousElementSibling?.querySelector('[contenteditable]')) {
        console.log('Case 1: Previous sibling has contenteditable');
        let siblings = target.previousElementSibling.querySelectorAll('[contenteditable]');
        newElement = Array.from(siblings).pop() || siblings;
        target.remove();
    } else if (targetParent) {
        console.log('Case 2: Parent has nested target found');
        currentNode = target

        if (currentNode.parentElement !== targetParent) {
            while(currentNode && currentNode.parentNode !== targetParent) {
            currentNode = currentNode.parentNode;
            }
        } else {
            currentNode = target;
        }

        if (targetParent.children.length > 1) {
            console.log('Case 2.1: Parent has multiple children');
            if (targetParent.children[0] === currentNode) {
                console.log('Case 2.1.1: Current node is first child');
                newElement = targetParent.previousElementSibling.querySelector('[contenteditable]') || targetParent.previousElementSibling;
            } else {
                console.log('Case 2.1.2: Current node is not first child');
                newElement = currentNode.previousElementSibling.querySelector('[contenteditable]') || currentNode.previousElementSibling;
            }
            currentNode.remove();
        } else {
          console.log('Case 2.2: Parent has only one child');
          addItems(target, 'paragraph');
          targetParent.remove();
          return;
        }
    } else {
        console.log('Case 3: No parent or sibling, fallback to previous sibling');
        // Fallback si aucun parent n'est trouvé
        newElement = target.previousElementSibling?.querySelector('[contenteditable]') || target.previousElementSibling;
        target.remove();
    }

    if (newElement) {
        caretPosition(newElement, 'set', 'end'); // Positionner le curseur à la fin
        newElement.focus(); // Focus sur le nouvel élément
    } else {
        console.warn('No valid element found for newElement');
    }

    return newElement;
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

noteContainer.addEventListener('keydown', (e) => {
    let editableElement = e.target.closest('[contenteditable="true"]');
    if (!editableElement) return;
    targetNode = editableElement;
    handleKeydown(e);
});

function handleKeydown(e) {
    if (e.key === "Backspace") {
        if (e.target.textContent.length === 1) {
            e.target.innerHTML = '';
        } else if (e.target.textContent.length === 0 && !e.target.classList.contains('title-page')) {
            if (e.target.tagName !== 'P' && getCommandDetail(e.target.getAttribute('data-name')) !== 'List') {
                addItems(e.target, 'paragraph');
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
        e.target.blur();
        commandInput.focus();
        resetCommandPalette();
    }
}

async function fetchSVG(commandName) {
    const svgPromises = commandName.map(async (name) => {
        try {
            const response = await fetch(`icon/${name}.svg`);
            return response.ok ? await response.text() : null;   
        } catch (error) {
            console.error(`Failed to fetch SVG: ${name}`, error);
            return null;
        }
    });
    return await Promise.all(svgPromises);
}

async function populateCommandPalette() {
    const allCommands = Object.values(commands).flat();
    const commandNames = allCommands.map(cmd => cmd.Name);
    const svgs = await fetchSVG(commandNames);

    for (const [category, categoryCommands] of Object.entries(commands)) {
        const container = document.createElement('div');
        container.classList.add('command-section');

        const header = document.createElement('h4');
        header.textContent = category;
        container.appendChild(header);

        const ul = document.createElement('ul');

        for (const command of categoryCommands) {
            const li = document.createElement('li');
            li.classList.add('command-item');
            const svgIndex = allCommands.findIndex(cmd => cmd.Name === command.Name);
            const svgContent = svgs[svgIndex] || '';

            li.innerHTML = `
                <button onclick="addItems(targetNode, '${command.Name}')">
                    ${svgContent}
                    <h5>${command.Name}</h5>
                </button>`;
            ul.appendChild(li);
        }
        container.appendChild(ul);
        commandPalette.appendChild(container);
    }
}

function resetCommandPalette() {
    const sections = commandPalette.querySelectorAll('.command-section');
    sections.forEach(section => {
        section.style.display = '';
        const items = section.querySelectorAll('.command-item');
        items.forEach(item => {
            item.style.display = '';
        });
    });
    commandPalette.querySelector('.select')?.classList.remove('select');
}

function filterCommandPalette(searchTerm) {
    const sections = commandPalette.querySelectorAll('.command-section');
    let firstMatch = null;
    commandPalette.querySelectorAll('.select').forEach(item => { item.classList.remove('select'); });

    sections.forEach(section => {
        const header = section.querySelector('h4');
        const items = section.querySelectorAll('.command-item');
        const searchLower = searchTerm.toLowerCase();    
        let sectionMatch = header.textContent.toLowerCase().includes(searchLower);
        let itemMatch = false;

        items.forEach(item => {
            const commandName = item.querySelector('h5').textContent.toLowerCase();

            if (sectionMatch || commandName.includes(searchLower)) {
                item.style.display = '';
                firstMatch ||= item;
                itemMatch = true;
            } else {
                item.style.display = 'none';
            }
        });

        sectionMatch || itemMatch ? section.style.display = '' : section.style.display = 'none';
    }); 
    firstMatch?.classList.add('select');
}

commandInput.addEventListener('input', (e) => {
    filterCommandPalette(e.target.value);
});

function handleKeyNavigation(e) {
    const commandPalette = document.querySelector('#command-palette');
    const selected = commandPalette.querySelector('.select');
    const allItems = Array.from(commandPalette.querySelectorAll('.command-item'))
        .filter(item => item.style.display !== 'none');

    let newSelected;
    const currentIndex = allItems.indexOf(selected);

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        newSelected = allItems[(currentIndex + 1) % allItems.length];
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        newSelected = allItems[(currentIndex - 1 + allItems.length) % allItems.length];
    } else if (e.key === 'Enter' && selected) {
        e.preventDefault();
        const commandType = selected.querySelector('h5').textContent;
        addItems(targetNode, commandType);
        commandPaletteContainer.hidePopover();
        return;
    }

    if (newSelected) {
        selected?.classList.remove('select');
        newSelected.classList.add('select');
        newSelected.scrollIntoView({ block: 'nearest' });
    }
}

commandInput.addEventListener('input', (e) => {
    filterCommandPalette(e.target.value);
});

commandInput.addEventListener('keydown', handleKeyNavigation);

function focusTargetBack() {
    targetNode || noteContainer.querySelector('[contenteditable]').focus();
    caretPosition(targetNode || noteContainer.querySelector('[contenteditable]'), 'set', 'end');
}

// Initialize
populateCommandPalette();
