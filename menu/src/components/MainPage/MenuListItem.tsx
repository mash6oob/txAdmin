import React, { memo, useEffect, useRef, useState } from "react";
import {
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  makeStyles,
  Theme,
} from "@material-ui/core";
import { useKeyboardNavigation } from "../../hooks/useKeyboardNavigation";
import { Code } from "@material-ui/icons";
import { fetchNui } from '../../utils/fetchNui';
import { ResolvablePermission, usePermissionsValue } from '../../state/permissions.state';

export interface MenuListItemProps {
  icon: JSX.Element;
  primary: string;
  secondary: string;
  onSelect: () => void;
  selected: boolean;
  requiredPermission: ResolvablePermission
}

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    borderRadius: 15,
  },
  icon: {
    color: theme.palette.text.secondary,
  },
  overrideText: {
    color: theme.palette.text.primary,
    fontSize: 16,
  },
}));
// TODO: Actually do disabled item styling right now it will only remove
// enter from working
export const MenuListItem: React.FC<MenuListItemProps> = memo(
  ({ icon, primary, onSelect, secondary, selected, requiredPermission }) => {
    const classes = useStyles();
    const divRef = useRef<HTMLDivElement | null>(null);
    const userPerms = usePermissionsValue()

    const handleEnter = (): void => {
      if (selected) {
        // Simple cancel if user doesn't have the permission
        if (!userPerms.permission.includes(requiredPermission)) return

        fetchNui('playSound', 'enter')
        onSelect()
      }
    }

    useEffect(() => {
      if (selected && divRef) {
        divRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'start'
        })
      }
    }, [selected])

    useKeyboardNavigation({
      onEnterDown: handleEnter,
      disableOnFocused: true
    })

    return (
      <div ref={divRef}>
        <ListItem
          onClick={() => onSelect()}
          className={classes.root}
          dense
          selected={selected}
        >
          <ListItemIcon className={classes.icon}>{icon}</ListItemIcon>
          <ListItemText
            primary={primary}
            secondary={secondary}
            classes={{
              primary: classes.overrideText,
            }}
          />
        </ListItem>
      </div>
    );
  }
);

interface MenuListItemMultiAction {
  label: string;
  value: string | number | boolean;
  onSelect: () => void;
  icon?: JSX.Element;
  primary?: string | JSX.Element;
}

export interface MenuListItemMultiProps {
  actions: MenuListItemMultiAction[];
  initialValue?: MenuListItemMultiAction;
  selected: boolean;
  primary: string;
  icon: JSX.Element;
  requiredPermission: ResolvablePermission
  showCurrentPrefix: boolean
}

export const MenuListItemMulti: React.FC<MenuListItemMultiProps> = memo(
  ({ selected, primary, actions, icon, initialValue, showCurrentPrefix, requiredPermission }) => {
    const classes = useStyles();
    const [curState, setCurState] = useState(0);
    const userPerms = usePermissionsValue()

    const compMounted = useRef(false);

    const divRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (selected && divRef) {
        divRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'start'
        })
      }
    }, [selected])

    // Mount/unmount detection
    // We will only run this hook after initial mount
    // and not on unmount.
    // NOTE: This hook does not work if actions prop are dynamic
    useEffect(() => {
      if (!compMounted.current) {
        compMounted.current = true;
        // We will set the initial value of the item based on the passed initial value
        const index = actions.findIndex((a) => a.value === initialValue?.value);
        setCurState(index > -1 ? index : 0);
      }
    }, [curState]);

    const handleLeftArrow = () => {
      if (!selected) return;
      // Simple cancel if user doesn't have the permission
      if (!userPerms.permission.includes(requiredPermission)) return;

      fetchNui('playSound', 'move')
      const nextEstimatedItem = curState - 1;
      const nextItem =
        nextEstimatedItem < 0 ? actions.length - 1 : nextEstimatedItem;
      setCurState(nextItem);
    };

    const handleRightArrow = () => {
      if (!selected) return;
      // Simple cancel if user doesn't have the permission
      if (!userPerms.permission.includes(requiredPermission)) return
      fetchNui('playSound', 'move')
      const nextEstimatedItem = curState + 1;
      const nextItem =
        nextEstimatedItem >= actions.length ? 0 : nextEstimatedItem;
      setCurState(nextItem);
    };

    const handleEnter = () => {
      if (selected) {
        // Simple cancel if user doesn't have the permission
        if (!userPerms.permission.includes(requiredPermission)) return
        fetchNui('playSound', 'enter')
        actions[curState].onSelect();
      }
    }

    useKeyboardNavigation({
      onRightDown: handleRightArrow,
      onLeftDown: handleLeftArrow,
      onEnterDown: handleEnter,
      disableOnFocused: true
    });

    return (
      <div ref={divRef}>
        <ListItem className={classes.root} dense selected={selected}>
          <ListItemIcon className={classes.icon}>{actions[curState]?.icon || icon}</ListItemIcon>
          <ListItemText
            primary={actions[curState]?.primary || primary}
            secondary={`${showCurrentPrefix ? "Current: " : ""}${actions[curState]?.label || "Unknown"}`}
            classes={{
              primary: classes.overrideText,
            }}
          />
          <ListItemSecondaryAction>
            <Code className={classes.icon} />
          </ListItemSecondaryAction>
        </ListItem>
      </div>
    );
  }
);
