interface AnimeInformation {
  instance: any;
  animation: any;
  tween: any;
}

function getInstanceAnimationAndTween(
  anime: any,
  targetTween: any
): AnimeInformation | undefined {
  let res = undefined;
  anime.running.forEach((instance: any) => {
    instance.animations.forEach((a: any) => {
      a.tweens.forEach((t: any) => {
        if (t.easing === targetTween) {
          res = {
            instance: instance,
            animation: a,
            tween: t
          };
        }
      });
    });
  });

  return res;
}

export { getInstanceAnimationAndTween };
