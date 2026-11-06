/** River outline layer; children render inside the svg. */
export default function BGNavigationalRiver(w, h, accent, children = "") {
  const width = String(w);
  const height = String(h);
  return `<svg class="BGNavigationalRiver SVG" version="1.1" height="${height}" width="${width}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M${width * 0.0858433734939759} ${height * 0.5524590163934426}
            L ${width * 0.1460843373493976} ${height * 0.27049180327868855}
           
            Q ${width * 0.214639175257732} ${height * 0.141087420042643924} ${
    width * 0.21234939759036145
  } ${height * 0.15901639344262294}
            Q ${width * 0.2102409638554217} ${height * 0.04065573770491806} ${
    width * 0.3102409638554217
  } ${height * 0.05065573770491806}
  
            L ${width * 0.4126506024096386} ${height * 0.10163934426229508}
            L ${width * 0.7469879518072289} ${height * 0.10655737704918032}
            L ${width * 0.9939759036144579} ${height * 0.14590163934426228}
            L ${width * 0.9909638554216867} ${height * 0.001278688524590164}
            L ${width * 0.05036144578313253} ${height * 0.00394426229508197}
            L ${width * 0.01355421686746988} ${height * 0.39672131147540984}
            L ${width * 0.006024096385542169} ${height * 0.978688524590164}
            L ${width * 0.061746987951807226} ${height * 0.7950819672131147}
            Z
        " stroke="#777" stroke-opacity="0.25" stroke-width="1" fill="transparent"></path><path d="M${width} ${height * 0.14447154471544716}
          L ${width * 0.9890859481582538} ${height * 0.15176151761517614}
          Q ${width * 0.77207366984993179} ${height * 0.082113821138211}
          ${width * 0.6207366984993179} ${height * 0.052113821138211}
          L ${width * 0.39154160982264663} ${height * 0.03517615176151762}

          L ${width * 0.296043656207367} ${height * 0.04533062330623306}
          L ${width * 0.19781718963165076} ${height * 0.04502168021680217}
          Q ${width * 0.1206139154160982} ${height * 0.04959349593495936}
          ${width * 0.1406139154160982} ${height * 0.064959349593495936}

          Q ${width * 0.05594815825375171} ${height * 0.25799457994579946}
          ${width * 0.04594815825375171} ${height * 0.5799457994579946}
          L ${width * 0.03957708049113233} ${height * 0.7967479674796748}
          L ${width * 0.014106412005457026} ${height * 0.9227642276422764}
        " stroke="transparent" fill="none" stroke-linejoin="round"></path>${children}</svg>`;
}
