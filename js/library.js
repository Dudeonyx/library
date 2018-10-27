/* eslint-env browser */
const titleCase = string => string.toLowerCase().replace(/^.| ./g, u => u.toUpperCase()); // eslint-disable-line no-unused-vars

const pipe = (...fns) => x => fns.reduce((y, f) => f(y), x);


const libraryModule = (() => {
  const myObject = (() => {
    function copy(o, flag) {
      const output = Array.isArray(o) ? [] : {};
      Object.keys(o).forEach((key) => {
        const v = o[key];
        output[key] = (typeof v === 'object' && flag === true) ? copy(v) : v;
      });
      return output;
    }
    function merge(objectA = {}, ...objects) {
      let flag;
      if (typeof objects[objects.length - 1] === 'boolean') {
        flag = objects.pop();
      }
      const newObject = Array.isArray(objectA) ? [] : Object.create(Object.getPrototypeOf(objectA));
      const propsA = Object.getOwnPropertyNames(objectA);
      propsA.forEach((prop) => {
        // if (Array.isArray(objectA) && prop === 'length') return;
        const desc = Object.getOwnPropertyDescriptor(objectA, prop);
        if (flag === true && desc.value !== null && typeof desc.value === 'object') {
          desc.value = merge(desc.value, true);
        }
        Object.defineProperty(newObject, prop, desc);
      });
      objects.forEach((object) => {
        const props = Object.getOwnPropertyNames(object);
        props.forEach((prop) => {
          const desc = Object.getOwnPropertyDescriptor(object, prop);
          if (flag === true && desc.value !== null && typeof desc.value === 'object') {
            desc.value = merge(desc.value, true);
          }
          if (prop !== 'constructor' && prop in newObject) {
            if (!newObject.duplicateProperties) { newObject.duplicateProperties = {}; }
            Object.defineProperty(newObject.duplicateProperties, prop, desc);
          } else {
            Object.defineProperty(newObject, prop, desc);
          }
        });
      });
      return newObject;
    }
    function setConstructor(constructor) {
      return (o, allMethodsPrototypal = false) => {
        const proto1 = Object.create(Object.getPrototypeOf(o));
        proto1.constructor = constructor;
        if (allMethodsPrototypal === true) {
          return Object.create(merge(proto1, o));
        }
        const proto2 = Object.create(proto1);
        return merge(proto2, o);
      };
    }
    function rClone(o, flag) {
      const clone = Array.isArray(o) ? [] : {};
      const props = Object.getOwnPropertyNames(o);
      props.forEach((prop) => {
        const desc = Object.getOwnPropertyDescriptor(o, prop);
        if (flag === true && desc.value !== null && typeof desc.value === 'object') {
          desc.value = rClone(desc.value, true);
        }
        Object.defineProperty(clone, prop, desc);
      });
      return clone;
    }
    return Object.freeze({
      merge,
      setConstructor,
      rClone,
      copy,
    });
  })();
  function LibraryList(libraryList = []) {
    return {
      withAddToLibraryList: o => myObject.merge(o, {
        addToLibraryList(library = this) {
          // if (library.constructor !== Library) throw new Error('Invalid Library');
          const libraryIndex = libraryList
            .findIndex(entry => entry.username === library.username);
          // check if another book with the same name is already in the shelf
          if (libraryIndex > -1) {
            console.log(`'${library.username}' already exists in Users`);
            return this;
          }
          libraryList.push(library);
          // console.log(`'${library.username}' has been added to Users`);
          return this;
        },
      }),
      showLibraryList: () => libraryList.reduce((acc, val) => `${acc}'${val.username}', `, '').replace(/, $/, ''),
    };
  }
  const { showLibraryList, withAddToLibraryList } = LibraryList([]);
  function Library(user) {
    const username = titleCase(user);
    function withShelfFunctions(shelf = []) {
      return o => myObject.merge(o, {
        get shelf() {
          return shelf.reduce((acc, val) => `${acc}'${val.title}', `, '').replace(/, $/, '');
        },
        listBooks() {
          return shelf.reduce((acc, val) => `${acc}'${val.title}', `, '').replace(/, $/, '');
        },
        displayShelf() {
          return shelf.concat();
        },
        saveBook(book) {
          // const { shelf } = this;
          const bookIndex = shelf.findIndex(entry => entry.title === book.title);
          // check if another book with the same name is already in the shelf
          if (bookIndex > -1) {
            return `'${book.title}' already exists in ${username}'s Library`;
          }
          shelf.push(book);
          return `'${book.title}' has been added to ${username}'s Library`;
        },
        deleteBook(book) {
          const bookIndex = shelf
            .findIndex(entry => entry === book || entry.title === book.title);
          // check if book is in the shelf
          if (bookIndex > -1) {
            shelf.splice(bookIndex, 1);
            return `'${book.title}' has been deleted from ${username}'s Library`;
          }
          return `'${book.title}' does not exist in ${username}'s Library`;
        },
      });
    }
    function Book(bookObject, owner = username) {
      const { title = 'Unknown', author = 'Unknown', pages = 0 } = bookObject;
      let status = bookObject.status ? titleCase(bookObject.status) : 'Not Read';
      const bookIndex = this.displayShelf().findIndex(book => book.title === title);
      // check if another book with the same name is already in the shelf
      if (bookIndex > -1) {
        throw new Error(`A book titled:'${title}' already exists in ${username}'s Library`);
      }
      function details(detail) {
        const allDetails = {
          title,
          author,
          pages,
          status,
          Library: owner,
        };
        return detail ? { [titleCase(detail)]: allDetails[titleCase(detail)] } : allDetails;
      }
      const toggleRead = (newStatus) => {
        const validStatus = !newStatus || titleCase(newStatus);
        if (newStatus || validStatus === 'Read' || validStatus === 'Not Read') {
          status = validStatus;
          return status;
        }
        status = status === 'Read' ? 'Not Read' : 'Read';
        return status;
      };
      const parent = this;
      function saveThisIn(library = parent) {
        return library.saveBook(this);
      }
      function deleteThisIn(library = parent) {
        return library.deleteBook(this);
      }
      const book = pipe(myObject.setConstructor(this.createBook))({
        get title() {
          return title;
        },
        details,
        get owner() {
          return owner;
        },
        toggleRead,
        saveThisIn,
        deleteThisIn,
      });
      this.saveBook(book);
      return Object.freeze(book);
    }
    const newLibrary = pipe(
      withAddToLibraryList,
      withShelfFunctions([]),
      myObject.setConstructor(Library),
    )({
      get username() {
        return username;
      },
      createBook: Book,
    });
    newLibrary.addToLibraryList();
    return Object.freeze(newLibrary);
  }
  Library.showLibraryList = showLibraryList;
  // Library.addToLibraryList = addToLibraryList;
  return { Library, myObject };
})();

const { Library } = libraryModule;
const umeayo = Library('Umeayo');
const adventure = umeayo.createBook({
  title: 'Adventures in JS',
  pages: 256,
  status: 'Not Read',
  author: 'Dudeonyx',
});
const story = umeayo.createBook({
  title: 'Stories in JS',
  pages: 128,
  status: 'Read',
  author: 'Dudeonyx',
});
umeayo.createBook({
  title: 'Wonders of JS',
  pages: 512,
  status: 'Read',
  author: 'Dudeonyx',
});

function $(element = document) {
  return selector => element.querySelector(selector);
}
function $All(element = document) {
  return selector => element.querySelectorAll(selector);
}
function $Create(element) {
  return document.createElement(element);
}
const shelf = $()('.shelf');

const testBook = $Create('div');
testBook.classList.add('book');
// shelf.appendChild(testBook);
const fgh = $(shelf)('.book');
(function addAllBooksToShelf() {
  umeayo.displayShelf().forEach((book, index) => {
    const {
      title, author, status, pages,
    } = book.details();
    const bookElement = $Create('div');
    bookElement.classList.add('book');
    bookElement.id = index;
    const titleField = bookElement.appendChild($Create('p'));
    const authorField = bookElement.appendChild($Create('p'));
    const pagesField = bookElement.appendChild($Create('p'));
    const statusField = bookElement.appendChild($Create('p'));
    titleField.setAttribute('data-title', title);
    authorField.setAttribute('data-author', author);
    pagesField.setAttribute('data-pages', pages);
    statusField.setAttribute('data-status', status);
    titleField.textContent = `Title: ${title}`;
    authorField.textContent = `Author: ${author}`;
    pagesField.textContent = `Pages: ${pages}`;
    statusField.textContent = `Status: ${status}`;
    Object.entries(book.details()).forEach((key) => {
      if (key[0] !== 'Library') {
        const field = bookElement.appendChild($Create('p'));
        field.textContent = `${titleCase(key[0])}: ${key[1]}`;
        field.setAttribute(`data-${key[0]}`, key[1]);
      }
    });
    shelf.appendChild(bookElement);
  });
}());
