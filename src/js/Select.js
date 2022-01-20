import { parseDate } from '../functions';
//Description
// заполнить лист передать в data массив [{name:'Name', id:'100'}]

function getTemplate(option){

    let text = '';
    let id = '';

    let list = [];

    if(option.data != undefined || option.data != null){
        list = option.data.map(item => {
            if(item.id == option.selectedId){
                text = item.name;
                id = item.id;
            }
            return `<p data-type="list-item" data-id="${item.id}">${item.name}</p>`;
        });
    }

    return `
        <div data-type="backdrop" class="select-js-backdrop"></div>
        <input value="${text}" data-type="input" type="text" class="${option.inputClass ?? 'table-input'}" placeholder="${option.placeholder ?? ''}" ${option.readonly ? 'readonly' : ''} ${option.required ? 'required' : ''}>
        <input value="${id}"  type="hidden" name="${option.model}">
        <label class="select-js-label">${option.label ?? ''}</label>
        ${option.arrow ? `<div class="select-js-arrow" data-type="arrow"></div>` : ''}
        ${option.clean ? `<div class="select-js-clean" data-type="clean"></div>` : ''}
        <div class="select-js-list" data-type="list">${list.join('')}</div>
    `;
}

export class SelectV2 {

    constructor(option){

        this.url = option.url;  // Куда отпраялвется запрос
        this.value = option.value; // Если нужно подставить значение
        this.selector = option.selector; // сcs-селектор родителя(куда вставить инпут)
        this.model = option.model;// Название модели для атрибута name
        this.query = option.query;// по событию input будет срабатывать запрос в экшн (bool)
        this.required = option.required;// обязательное поле (bool)
        this.data = option.data;// если передаем данные из экшена не через запрос, а через html-атрибут 
        this.inputClass = option.inputClass;// класс для инпута
        this.label = option.label;// класс для инпута
        this.placeholder = option.placeholder;//чтобы работал label нужен placeholder
        this.readonly = option.readonly;//(bool)
        this.arrow = option.arrow;//(bool)
        this.clean = option.clean;//(bool)
        this.edit = option.edit;// параметр редактирования
        this.selectedId = option.selectedId; // id выбранного элемента из спика

        this.$wrapper = document.createElement('div');
        this.$wrapper.classList.add('select-js-wrapper');

        this.option = option;

        this.#render(option);
        this.input = this.$wrapper.querySelector('input[type="text"]');
        this.inputHidden = this.$wrapper.querySelector('input[type="hidden"]');
        this.#setup();
       

        //для поиска вводом
        this.list = this.$wrapper.querySelector('[data-type="list"]');

        this.#checkEdit();

        this.hierarchy = option.hierarchy; // принимает массив [{docid,groupDoc,isgroup,Name}]

        if(this.hierarchy){
            if(this.hierarchy.length != 0){
               this.ul = this.hierarchyMenu();
                this.list.innerHTML = '';
                this.list.append(this.ul);
            }
        }
    
    }
    
    getWrapper(){
        return this.$wrapper;        
    }

    #render(){
        this.$wrapper.innerHTML = getTemplate(this.option);

        if(this.selector){
            const out = document.querySelector(this.selector);
            out.append(this.$wrapper);
        }
    }

    #setup(){
        this.clickHandler = this.clickHandler.bind(this);
        this.$wrapper.addEventListener('click', this.clickHandler);

        this.inputHandler = this.inputHandler.bind(this);
        
        this.input.addEventListener('input', this.inputHandler);
    }

    clickHandler(event){
        const {type} = event.target.dataset;
        
        if(type === 'input' || type === 'arrow'){
            this.toggle();
        }else if(type === 'clean'){
            this.input.value = '';
            this.inputHidden.value = '';
            // this.chekErrorClass();
            this.refreshSelected();
        }else if(type === 'list-item'){
            this.select(event.target.dataset.id);
        }else if(type === 'backdrop'){
            this.toggle();
        }
    }

    inputHandler(event){
        
        let value = event.target.value;

        let search = this.option.data.filter(el => searchItems(el.name, value));

        this.list.innerHTML = getItems(search);

        function getItems(array){
            let result = array.map(item=> {
                return `<p data-type="list-item" data-id="${item.id}">${item.name}</p>`;
            });
            return result.join('');
        }

        function searchItems(elem, value){
            let bool = false;
            let regexLeft = new RegExp('^' + value, 'i');
            let regexRight = new RegExp(' ' + value, 'i');
            if(regexLeft.test(elem) || regexRight.test(elem)){
                bool = true;
            }

            return bool;
        }

        if(value === ''){
            this.list.innerHTML = getItems(this.option.data);
        }
    }

    select(id){
        this.selectedId = id;
        this.input.value = this.current.name;
        this.inputHidden.value = this.current.id;

        this.refreshSelected();
        this.$wrapper.querySelector(`p[data-id="${id}"]`).classList.add('selected');
        this.close();
    }

    refreshSelected(){
        this.$wrapper.querySelectorAll(`[data-type="list-item"]`).forEach(item => item.classList.remove('selected'));
    }

    get current(){
        return this.option.data.find(item => item.id == this.selectedId);
    }

    get isOpen(){
        return this.$wrapper.classList.contains('_open-select-js-list');
    }

    get isError(){
        return this.$wrapper.classList.contains('has-error');
    }

    toggle(){
        this.isOpen ? this.close() : this.open();
    }

    chekErrorClass(){
        this.isError ? this.$wrapper.classList.remove('has-error') : this.$wrapper.classList.add('has-error');
    }

    pasteHandler(event){

    }

    open(){
        this.$wrapper.classList.add('_open-select-js-list');
    }

    close(){
        this.$wrapper.classList.remove('_open-select-js-list');
    }

    #checkEdit(){
        if(this.edit != undefined){
            if(!this.edit){
                this.$wrapper.classList.add('_no-edit');
            }
        }
    }

    destroy(){
        this.$wrapper.removeEventListener('click', this.clickHander);
        this.$wrapper.parentElement.innerHTML = '';

        this.input.removeEventListener('input', this.inputHandler);
    }

    hierarchyMenu(){
        const data = this.hierarchy;
        console.log(JSON.stringify(data))
        
        //рекурсия для меню(раскладывает в каждого парента своих чилдов)
        let first = data.filter(el => el.groupDoc == 0);

        first.forEach(el => {

            if(isGroup(el)){
                checkChild(createSubnav(el));
            }
            
        });

        function checkChild(arr){
            arr.forEach(el => {
                if(isGroup(el)){
                    checkChild(createSubnav(el));
                }
            });
        }

        function createSubnav(el){
            let { docid } = el;
            let arr = data.filter(el => docid == el.groupDoc);
            el.child = arr;
            return arr;
        }

        function isGroup(el){
            return el.isgroup === true ? true : false;
        }

        //рисуем меню из first
        let menu = [];

        let ul = document.createElement('ul');
        ul.classList.add('hierarchy-menu__main');

        menu = first.map(el => {
            let li = createLi(el);

            if(checkItem(el)){
                li.append(createUl(el.child));
                li.classList.add('has-child');
            }

            ul.append(li);
        });

        function createUl(child){
            let ul = document.createElement('ul');
            ul.dataset.type = 'hierarchy-menu';
            ul.classList.add('hierarchy-menu__subnav');

            child.forEach(el => {
                let li = createLi(el);
                if(checkItem(el)){
                    li.append(createUl(el.child));
                    li.classList.add('has-child');
                }
                ul.append(li);
            });

            return ul;
        }

        function checkItem(el){
            if(el.child){
                return el.child?.length != 0 ? true : false;
            }else {
                return false
            }
        }

        function createLi(el){
            let li = document.createElement('li');
            li.setAttribute('docid', el.docid);
            li.dataset.type = 'hierarchy-item';
            li.classList.add('hierarchy-menu__item');
            let text = document.createElement('span');
            text.textContent = el.name;
            li.append(text);
            return li;
        }

        this.clickHandlerHierarchy = this.clickHandlerHierarchy.bind(this);
        ul.addEventListener('click', this.clickHandlerHierarchy);

        this.dblClickHierarchy = this.dblClickHierarchy.bind(this);
        ul.addEventListener('dblclick', this.dblClickHierarchy);

        return ul;
    }

    //методы для иерархического меню
    clickHandlerHierarchy(event){
        let { type } = event.target.dataset;
        if(type == 'hierarchy-item'){
            toggle(event.target);
        }

        function open(item){
            item.classList.add('open-hierarchy-menu');
        }

        function close(item){
            item.classList.remove('open-hierarchy-menu');
        }

        function isOpen(item){
            return item.classList.contains('open-hierarchy-menu');
        }

        function toggle(item){
            isOpen(item) ? close(item) : open(item);
        }
    }

    dblClickHierarchy(event){
        let { type } = event.target.dataset;
        if(type == 'hierarchy-item'){
            const id = event.target.getAttribute('docid');
            const text = event.target.firstChild.textContent;
            this.input.value = text;
            this.inputHidden.value = id;
            this.toggle();
            this.refreshSelectedHierarchy();
            event.target.classList.add('selected');
            event.target.classList.remove('open-hierarchy-menu');
        }
    }
    refreshSelectedHierarchy(){
        this.ul.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    }
}
