const args = {extra_actions: 10}
const sortedIDs = [37848, 37849, 37851, 37852, 37853, 37855, 37856, 37858, 37859, 37861, 37863, 37864, 37865, 37867, 37869, 37876, 37877, 37883, 37884, 37886, 37895, 37923, 37924, 37925, 37926, 38542, 38543, 39554, 39732, 39733, 39734, 39735, 39886, 1000043, 1002911, 1002940, 1004019];
while(sortedIDs.length > 0) {
  const start = sortedIDs.shift() - args.extra_actions;
  let end = start + args.extra_actions * 2;
  while(sortedIDs.length > 0 && (sortedIDs[0] - args.extra_actions) <= end) {
    end = sortedIDs.shift() + args.extra_actions;
  }
  console.log(`Adding actions from ${start}-${end}`);
}
