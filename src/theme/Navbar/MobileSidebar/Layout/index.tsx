/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import clsx from "clsx";
import { useNavbarSecondaryMenu } from "@docusaurus/theme-common/internal";
import type { Props } from "@theme/Navbar/MobileSidebar/Layout";
import { useLocation } from "@docusaurus/router";

export default function NavbarMobileSidebarLayout({
  header,
  primaryMenu,
  secondaryMenu,
}: Props): JSX.Element {
  const { shown: secondaryMenuShown } = useNavbarSecondaryMenu();
  const location = useLocation();
  const currentPath = location.pathname;
  return (
    <div className="navbar-sidebar">
      {header}
      <div
        className={clsx("navbar-sidebar__items", {
          "navbar-sidebar__items--show-secondary":
            secondaryMenuShown && !(currentPath === "/litepaper/") && !(currentPath === "/roadmap/interactive-tech-tree"),
        })}
      >
        <div className="navbar-sidebar__item menu">{primaryMenu}</div>
        <div className="navbar-sidebar__item menu">{secondaryMenu}</div>
      </div>
    </div>
  );
}
