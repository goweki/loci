import {
  useRef,
  useEffect,
  useContext,
  createContext,
  type ReactNode,
  type ElementType,
} from "react";
import { CSSTransition as ReactCSSTransition } from "react-transition-group";

// Context
const TransitionContext = createContext<{ parent: any }>({
  parent: {},
});

// Main Transition wrapper
export default function Transition({
  show,
  appear = false,
  children,
  ...rest
}: {
  show?: boolean;
  appear?: boolean;
  children: ReactNode;
  [key: string]: any;
}) {
  const { parent } = useContext(TransitionContext);
  const isInitialRender = useIsInitialRender();
  const isChild = show === undefined;

  if (isChild) {
    return (
      <CSSTransition
        appear={parent.appear || !parent.isInitialRender}
        show={parent.show}
        {...rest}
      >
        {children}
      </CSSTransition>
    );
  }

  return (
    <TransitionContext.Provider
      value={{
        parent: {
          show,
          isInitialRender,
          appear,
        },
      }}
    >
      <CSSTransition appear={appear} show={show} {...rest}>
        {children}
      </CSSTransition>
    </TransitionContext.Provider>
  );
}

// Hook to detect first render
function useIsInitialRender() {
  const isInitialRender = useRef(true);
  useEffect(() => {
    isInitialRender.current = false;
  }, []);
  return isInitialRender.current;
}

// Inner CSSTransition handler
function CSSTransition({
  show,
  enter = "",
  enterStart = "",
  enterEnd = "",
  leave = "",
  leaveStart = "",
  leaveEnd = "",
  appear = false,
  unmountOnExit = true,
  tag: Component = "div",
  children,
  ...rest
}: {
  show: boolean;
  enter?: string;
  enterStart?: string;
  enterEnd?: string;
  leave?: string;
  leaveStart?: string;
  leaveEnd?: string;
  appear?: boolean;
  unmountOnExit?: boolean;
  tag?: ElementType; // ✅ ElementType instead of JSX.IntrinsicElements
  children: ReactNode;
  [key: string]: any;
}) {
  const enterClasses = enter.split(" ").filter(Boolean);
  const enterStartClasses = enterStart.split(" ").filter(Boolean);
  const enterEndClasses = enterEnd.split(" ").filter(Boolean);
  const leaveClasses = leave.split(" ").filter(Boolean);
  const leaveStartClasses = leaveStart.split(" ").filter(Boolean);
  const leaveEndClasses = leaveEnd.split(" ").filter(Boolean);
  const removeFromDom = unmountOnExit;

  function addClasses(node: HTMLElement, classes: string[]) {
    if (classes.length) node.classList.add(...classes);
  }

  function removeClasses(node: HTMLElement, classes: string[]) {
    if (classes.length) node.classList.remove(...classes);
  }

  const nodeRef = useRef<HTMLElement | null>(null);

  return (
    <ReactCSSTransition
      appear={appear}
      nodeRef={nodeRef}
      unmountOnExit={removeFromDom}
      in={show}
      addEndListener={(done) => {
        nodeRef.current?.addEventListener("transitionend", done, false);
      }}
      onEnter={() => {
        if (!removeFromDom && nodeRef.current)
          nodeRef.current.style.display = "";
        if (nodeRef.current)
          addClasses(nodeRef.current, [...enterClasses, ...enterStartClasses]);
      }}
      onEntering={() => {
        if (nodeRef.current) {
          removeClasses(nodeRef.current, enterStartClasses);
          addClasses(nodeRef.current, enterEndClasses);
        }
      }}
      onEntered={() => {
        if (nodeRef.current) {
          removeClasses(nodeRef.current, [...enterEndClasses, ...enterClasses]);
        }
      }}
      onExit={() => {
        if (nodeRef.current)
          addClasses(nodeRef.current, [...leaveClasses, ...leaveStartClasses]);
      }}
      onExiting={() => {
        if (nodeRef.current) {
          removeClasses(nodeRef.current, leaveStartClasses);
          addClasses(nodeRef.current, leaveEndClasses);
        }
      }}
      onExited={() => {
        if (nodeRef.current) {
          removeClasses(nodeRef.current, [...leaveEndClasses, ...leaveClasses]);
          if (!removeFromDom) nodeRef.current.style.display = "none";
        }
      }}
    >
      <Component
        ref={nodeRef}
        {...rest}
        style={{ display: !removeFromDom ? "none" : undefined }}
      >
        {children}
      </Component>
    </ReactCSSTransition>
  );
}
