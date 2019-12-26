import { Vec2, vec2 } from "@/components/graph/util/math";

export enum MenuOptionType {
  Default = 0,
  Header = 1,
  Spacer = 2
}

export interface MenuOption {
  type: MenuOptionType;
  label: string;
  action: string;

  children: MenuOption[];
}

export interface OptionTree {
  options: MenuOption[];
}

export default class Menu {
  position: Vec2;
  tree: OptionTree;
  visible: boolean;

  constructor() {
    this.position = vec2(0, 0);

    const spacer = {
      type: MenuOptionType.Spacer,
      label: "",
      action: "",
      children: []
    };

    this.tree = {
      options: [
        {
          type: MenuOptionType.Header,
          label: "Curve Context Menu",
          action: "",
          children: []
        },
        spacer,
        {
          type: MenuOptionType.Default,
          label: "Copy",
          action: "copy-point",
          children: []
        },
        {
          type: MenuOptionType.Default,
          label: "Snap",
          action: "",
          children: []
        }
      ]
    };

    this.visible = false;
  }

  public setOptionTree(options: OptionTree) {
    this.tree = options;
  }

  public show() {
    this.visible = true;
  }

  public hide() {
    this.visible = false;
  }
}
