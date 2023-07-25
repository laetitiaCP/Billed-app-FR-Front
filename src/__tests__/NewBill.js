/**
 * @jest-environment jsdom
 */

import {fireEvent, screen, waitFor} from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import {localStorageMock} from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import {ROUTES, ROUTES_PATH} from "../constants/routes.js";
import BillsUI from "../views/BillsUI.js";
import {bills} from "../fixtures/bills.js";
import mockStore from "../__mocks__/store";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then mail icon in vertical layout should be highlighted\"", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const windowIcon = screen.getByTestId('icon-mail')
      expect(windowIcon.className).toEqual("active-icon");
    })

    test("Then the page contains all the components", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      expect(screen.getByTestId("expense-type")).toBeTruthy();
      expect(screen.getByTestId("expense-name")).toBeTruthy();
      expect(screen.getByTestId("datepicker")).toBeTruthy();
      expect(screen.getByTestId("amount")).toBeTruthy();
      expect(screen.getByTestId("commentary")).toBeTruthy();
      expect(screen.getByTestId("file")).toBeTruthy();
      expect(screen.getByTestId("btn-submit")).toBeTruthy();
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
    })
  })
  describe("When I am on a newbill page and and I choose a file with an extension not accepted", () => {
    test("Then a message indicates which are the correct file types", () => {

      document.body.innerHTML = NewBillUI();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      }

      const store = null;

      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }));

      const newBill = new NewBill( {document, onNavigate, store, localStorage});
      const handleChangeFile = jest.fn( () => newBill.handleChangeFile);
      const file = screen.getByTestId("file");

      window.alert = jest.fn();
      file.addEventListener("change", handleChangeFile);
      const newBadFile = new File(["file.pdf"], "file.pdf", {type:"file/pdf"});
      fireEvent.change(file, {
        target: { files: [newBadFile],
        }
      });

      jest.spyOn(window, "alert");
      expect(alert).toHaveBeenCalled();
      expect(handleChangeFile).toHaveBeenCalled();
      expect(document.getElementById("input-file").value).toEqual("");
      expect(newBill.validateFileExtension(newBadFile)).toBe(false);
    })
  })

  describe("When I am on a newbill page and and I choose a file with an accepted extension",() => {
    test("then the file name is displayed", () => {
      document.body.innerHTML = NewBillUI();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      }

      const store = {
        bills: jest.fn( () => newBill.store ),
        create: jest.fn( () => Promise.resolve({}))
      };

      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }));

      const newBill = new NewBill( {document, onNavigate, store, localStorage});
      const handleChangeFile = jest.fn( (e) => newBill.handleChangeFile(e));
      const file = screen.getByTestId("file");

      window.alert = jest.fn();
      file.addEventListener("change", handleChangeFile);
      const newGoodFile = new File(["file.png"], "file.png", {type:"image/png"});
      fireEvent.change(file, {
        target: { files: [newGoodFile],
        }
      });
      jest.spyOn(window, "alert");
      expect(handleChangeFile).toHaveBeenCalled();
      expect(newBill.validateFileExtension(newGoodFile)).toBe(true);
      expect(file.files[0].name).toBe("file.png");
    })
  })

  describe("When I am on a newbill page and I click submit button", () => {
    test("Then handleSubmit must be called", () => {
      document.body.innerHTML = NewBillUI();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      }

      const store = null;

      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }));

      const newBill = new NewBill( {document, onNavigate, store, localStorage});
      const formNewBill = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(newBill.handleSubmit);
      formNewBill.addEventListener("submit", handleSubmit);
      fireEvent.submit(formNewBill);

      expect(handleSubmit).toHaveBeenCalled();
      expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
    })
  })
})
/** Ajout test d'intégration POST **/
describe("Given I am connected as an employee", () => {
  describe("When I am on a newbill page and submit the form", () => {
    test("Then this should generate a new bill", async () => {
      const postSpyOn = jest.spyOn(mockStore,"bills");
      const bill = {
        "id": "47qAXb6fIm2zOKkLzMro",
        "vat": "80",
        "fileUrl": "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        "status": "pending",
        "type": "Hôtel et logement",
        "commentary": "séminaire billed",
        "name": "encore",
        "fileName": "preview-facture-free-201801-pdf-1.jpg",
        "date": "2004-04-04",
        "amount": 400,
        "commentAdmin": "ok",
        "email": "a@a",
        "pct": 20
      };
      const postBill = await mockStore.bills().update(bill);
      expect(postSpyOn).toHaveBeenCalled();
      expect(postBill).toStrictEqual(bill);
    })
  })
  describe("When an error occurs on API", () => {
    beforeEach( () => {
      document.body.innerHTML = NewBillUI();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      }

      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }));
    });
    test("Then fails with error 404", async () => {
      const spyOn = jest.spyOn(console, "error");
      const store = {
        bills: jest.fn(() => newBill.store),
        create: jest.fn(() => Promise.resolve({})),
        update: jest.fn(() => Promise.reject(new Error("404"))),
      };
      const newBill = new NewBill({ document, onNavigate, store, localStorage });

      const formNewBill = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(() => newBill.handleSubmit);
      formNewBill.addEventListener("submit", handleSubmit);

      fireEvent.submit(formNewBill);
      await new Promise(process.nextTick);
      expect(spyOn).toBeCalledWith(new Error("404"));
    });
    test("Then fails with error 505", async () => {
      const spyOn = jest.spyOn(console, "error");
      const store = {
        bills: jest.fn(() => newBill.store),
        create: jest.fn(() => Promise.resolve({})),
        update: jest.fn(() => Promise.reject(new Error("505"))),
      };
      const newBill = new NewBill({ document, onNavigate, store, localStorage });

      const formNewBill = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(() => newBill.handleSubmit);
      formNewBill.addEventListener("submit", handleSubmit);

      fireEvent.submit(formNewBill);
      await new Promise(process.nextTick);
      expect(spyOn).toBeCalledWith(new Error("505"));
    })
  })
})
