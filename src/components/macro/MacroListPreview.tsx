import { IconButton, ImageList, ImageListItem, ImageListItemBar, ImageListItemProps, styled } from "@mui/material";
import { MacroFields, macroStore } from "../../firebase/store/Macro";
import { DisplayModeComponentProps } from "../DocList";
import { Route as MacroRoute } from '../../routes/macro/$macroID';
import { createLink } from "@tanstack/react-router";
import React from "react";
import Preview from "./Preview";
import { updated } from "../../firebase/store/UserDocStore";
import DeleteIcon from '@mui/icons-material/Delete';




const RoundedImageListItem = styled(
  createLink(
    React.forwardRef<HTMLAnchorElement, ImageListItemProps>(
      (props, ref) => {
        return <ImageListItem component={'a'} ref={ref} {...props} />
      },
    )
  )
)(({ theme }) => ({
    // borderColor: "white",
    borderColor: theme.vars.palette.grey[600],
    borderRadius: theme.vars.shape.borderRadius,
    borderWidth: 1,
    borderStyle: "solid",
    background: theme.vars.palette.background.paper,
    overflow: "hidden"
}));

export default function PreviewList({ docs }: DisplayModeComponentProps<MacroFields>) {
  return (
    <ImageList
      cols={1}
      variant="masonry"
      gap={8}
      sx={{
        marginBottom: 0, marginTop: 0, padding: "2px 4px"
      }}
    >
      {docs.map((doc) => (
        <RoundedImageListItem
          key={doc.id}
          to={MacroRoute.to}
          params={{
            macroID: doc.id
          }}
        >
          <Preview
            className="MuiImageListItem-img"
            mask={`data:image/png;base64,${doc.thumbnail.toBase64()}`}
          />
          <ImageListItemBar
            title={doc.name}
            subtitle={updated(doc)}
            actionIcon={
              <IconButton
                color="inherit"
                aria-label="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  macroStore.markDeleted(doc.id);
                }}
              >
                <DeleteIcon />
              </IconButton>
            }
          />
        </RoundedImageListItem>
      ))}
    </ImageList>
  )
}
    
    