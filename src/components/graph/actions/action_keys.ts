enum StateActionKeys {
  Undo = "undo",
  Redo = "redo",

  Copy = "copy-curves",

  DebugShowCurves = "debug-show-curves",
  Zoom = "zoom",

  SelectPoint = "select-point",
  OpenMenu = "open-menu",

  // Curve manipulation
  InsertKeyframe = "insert-keyframe",
  InsertKeyframeAllCurves = "insert-keyframe-all-curves",
  DeleteControlPoint = "delete-control-point",
  SetGuideFrame = "set-guide-frame",
  SetGuideFrameToSelectedPointFrame = "set-guide-frame-to-selected-point-frame",
  SetGuideValue = "set-guide-value",
  MoveScreen = "move-screen",

  ChangeInterpolationType = "change-interpolation-type",
  UseFixedControlPoints = "use-fixed-control-points",

  SnapFrame = "snap-to-frame",
  SnapValue = "snap-to-value",

  ContinuousHandles = "make-continuous",

  // Properties clicks
  ToggleVisible = "toggle-visible",
  ToggleLocked = "toggle-locked",
  EditName = "edit-name",
  EditValue = "edit-value",
  EditPointValue = "edit-point-value",
  EditPointFrame = "edit-point-frame",
  EditRepeatFrame = "edit-repeat-frame",
  ClearRepeatFrame = "clear-repeat-frame",
  SubmitEdit = "submit-edit",

  // Playback
  PlayAtFPS = "play-at-fps",

  PlayOrPause = "play-or-pause"
}

export { StateActionKeys };
