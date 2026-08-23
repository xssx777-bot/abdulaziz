/**
 * Installs a DOM so React components can render under `node --test`, which
 * otherwise runs in a bare Node environment with no `document`.
 *
 * Imported for its side effects at the top of every component test, before
 * React or Testing Library, both of which capture globals on first import.
 */
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});

// defineProperty rather than assignment: Node 22 exposes some of these
// (navigator among them) as getter-only globals that silently reject `=`.
const define = (name: string, value: unknown) =>
  Object.defineProperty(globalThis, name, { value, writable: true, configurable: true });

define('window', dom.window);
define('document', dom.window.document);
define('navigator', dom.window.navigator);
define('HTMLElement', dom.window.HTMLElement);
define('Element', dom.window.Element);
define('Node', dom.window.Node);
define('Event', dom.window.Event);
define('MouseEvent', dom.window.MouseEvent);
define('getComputedStyle', dom.window.getComputedStyle);
define('requestAnimationFrame', (callback: (time: number) => void) =>
  setTimeout(() => callback(Date.now()), 0));
define('cancelAnimationFrame', (handle: number) => clearTimeout(handle));

// React 18 reads this to decide whether act() warnings apply.
define('IS_REACT_ACT_ENVIRONMENT', true);
