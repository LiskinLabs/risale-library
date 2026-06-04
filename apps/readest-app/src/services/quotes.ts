/**
 * Vecize (Aphorism) Service — curated quotes from Risale-i Nur.
 *
 * Used by the Quote of the Day widget on the library home screen.
 * Quotes are from the 15 core Risale books, extracted from the
 * kitaplar corpus and Diyanet text.
 */

export interface Vecize {
  id: string;
  text: string;
  book: string;
  section?: string;
  author?: string;
}

/** Curated quotes from Risale-i Nur — expand via tools/import-vecize.py */
export const VECIZELER: Vecize[] = [
  { id: 'mn-02', text: "Kâinatın en hakiki güneşi, Kur'an'dır.", book: 'Mesnevî-i Nuriye' },
  {
    id: 'am-01',
    text: 'Hem her insanın küçük bir dünyası, belki küçük bir cenneti dahi kendi hanesidir.',
    book: 'Asâ-yı Musa',
    section: '108 Sekizinci Mesele',
  },
  {
    id: 'am-02',
    text: 'Elbette melaike ve ruhların ve ruhaniyatın vücud ve ubudiyetlerine şehadet eden deliller, dolayısıyla âhiretin vücuduna dahi delâlet ederler.',
    book: 'Asâ-yı Musa',
    section: '107 Yedinci Mesele',
  },
  {
    id: 'am-03',
    text: 'Değil hayvanların en ulvisi belki baş aşağı, akıl cihetiyle en bîçaresi ve aşağısı olmak vaziyetine düşeceği sırada, âhirete iman imdada yetişir.',
    book: 'Asâ-yı Musa',
    section: '108 Sekizinci Mesele',
  },
  {
    id: 'am-04',
    text: 'Eğer iman-ı âhiret o hanenin saadetinde hükmetmezse o aile efradı, her biri şefkat ve muhabbet ve alâkadarlığı derecesinde elîm endişeler ve azaplar çeker.',
    book: 'Asâ-yı Musa',
    section: '108 Sekizinci Mesele',
  },
  {
    id: 'am-05',
    text: 'Elbette adem, idam, hiçlik, mahv, fena; hakikat noktasında ehl-i imanın dünyasında yoktur ve kâfir münkirlerin dünyaları ademle, firakla, hiçlikle, fânilikle doludur.',
    book: 'Asâ-yı Musa',
    section: '110 Onuncu Mesele',
  },
  {
    id: 'am-06',
    text: 'Evet, bütün fenalıklar ve günahlar ve şerlerin mâyesi ve esasları ademdir, tahriptir.',
    book: 'Asâ-yı Musa',
    section: '111 On Birinci Mesele',
  },
  {
    id: 'am-07',
    text: 'Risale-i Nur’daki bütün mizanlar ve muvazeneler, imanın saadet-i dünyeviyeye ve uhreviyeye medar meyvelerini beyan ederler.',
    book: 'Asâ-yı Musa',
    section: '111 On Birinci Mesele',
  },
  {
    id: 'am-08',
    text: 'Gayet kuvvetli bir tezahüratla vahiylerin hakikati, âlem-i gaybın her tarafında her zamanda hükmediyor.',
    book: 'Asâ-yı Musa',
    section: '201 Birinci Hüccet-i İmaniye',
  },
  {
    id: 'am-09',
    text: 'Ve ilim sıfatı dahi hikmetli, intizamlı, mizanlı olan bütün masnuat miktarınca ve ilim ile idare ve tedbir ve tezyin ve temyiz edilen bütün mahlukat adedince, mevsufları olan bir tek Zat-ı Akdes’i bildirir.',
    book: 'Asâ-yı Musa',
    section: '201 Birinci Hüccet-i İmaniye',
  },
  {
    id: 'am-10',
    text: 'Tabiatı bırakan ve hakikate geçen zat diyor ki: Cenab-ı Hakk’a zerrat adedince şükür ve hamd ü sena ediyorum ki kemal-i imanı kazandım, evham ve dalaletlerden kurtuldum ve hiçbir şüphem de kalmadı.',
    book: 'Asâ-yı Musa',
    section: '203 Üçüncü Hüccet-i İmaniye',
  },
  {
    id: 'bl-01',
    text: 'Risale-i Nur’un bütün cüzlerinde öyle bir kuvvet var ki yalnız birini dinlemeye, okumaya veya yazmaya muvaffak olan kimse Allah tevfik verirse imanını kurtaracak hakikatleri onda bulur.',
    book: 'Barla Lahikası',
    section: '17 Barla Lâhikası s.300-321',
  },
  {
    id: 'bl-02',
    text: 'Zaten mükerreren demiştim: Herkes her risalenin her meselesini anlamasına muhtaç değil.',
    book: 'Barla Lahikası',
    section: '19 Barla Lâhikası s.340-362',
  },
  {
    id: 'bl-03',
    text: 'Şu sırrın hikmeti budur ki: Eski zamanda, esasat-ı imaniye mahfuzdu, teslim kavî idi.',
    book: 'Barla Lahikası',
    section: '02 Barla Lâhikası - Yedinci Risale',
  },
  {
    id: 'bl-04',
    text: 'Risale-i Nur ile ihda buyurduğunuz dualar, zaten her gün sevgili Üstadı düşünmeye kâfi gelmektedir.',
    book: 'Barla Lahikası',
    section: '03 Barla Lâhikası s.21-39',
  },
  {
    id: 'bl-05',
    text: 'Bu eserinizi Risale-i Nur ve Mektubatü’n-Nur’un en münevverleri safında mütalaa ediyorum.',
    book: 'Barla Lahikası',
    section: '03 Barla Lâhikası s.21-39',
  },
  {
    id: 'bl-06',
    text: 'Hakikat böyle olduğunu bildiğim için bütün meşakkatlere şükür ile beraber sabretmekteyim.',
    book: 'Barla Lahikası',
    section: '03 Barla Lâhikası s.21-39',
  },
  {
    id: 'bl-07',
    text: 'Acz ve fakrdaki lezzet, şefkat ve tefekkürdeki ulviyet; hakikaten hiçbir şeyle kabil-i kıyas değilmiş.',
    book: 'Barla Lahikası',
    section: '04 Barla Lâhikası s.40-58',
  },
  {
    id: 'bl-08',
    text: 'Efendim, malûmunuz fakir talebeniz ve kardeşiniz cahil olduğum halde, güneş-misali olan risale-i bergüzidelerinizden umum Nur Risalelerinizi okutup dinledim.',
    book: 'Barla Lahikası',
    section: '04 Barla Lâhikası s.40-58',
  },
  {
    id: 'bl-09',
    text: 'İkincisi: Ubudiyetin iktiza ettiği ve bu Nurlardan aldığım derslerin delâlet ettiği vecihle bütün kusurları tekmil; fenalıkları nefsimden ve iyilikleri, iyi şeyleri Allah’tan biliyorum.',
    book: 'Barla Lahikası',
    section: '05 Barla Lâhikası s.59-80',
  },
  {
    id: 'bl-10',
    text: 'Efendim, görmüş olduğum Risale-i Nur deryasındaki lezzet ve saadetin dünyada hiç emsalini göremediğim gibi kendi vicdanî muhakemem neticesinde kat’iyen anladım ki o Risaleler her biri başlı başına ve ayrı ayrı birer tefsir-i Kur’an’dır.',
    book: 'Barla Lahikası',
    section: '05 Barla Lâhikası s.59-80',
  },
  {
    id: 'ed1-01',
    text: 'Halbuki Risale-i Nur’da daima dava edip demişim: “Zaman tarîkat zamanı değil belki imanı kurtarmak zamanıdır.',
    book: 'Emirdağ Lahikası-1',
    section: '02 Emirdağ Lâhikası - I s.10-31',
  },
  {
    id: 'ed1-02',
    text: 'Ben ve Risale-i Nur, sizinle değil mübareze, belki sizi düşünmek dahi vazifemizin haricindedir.',
    book: 'Emirdağ Lahikası-1',
    section: '02 Emirdağ Lâhikası - I s.10-31',
  },
  {
    id: 'ed1-03',
    text: 'Halbuki hakaik-i imaniye ve hizmet-i nuriye-i kudsiye, kâinatta hiçbir şeye âlet olamaz.',
    book: 'Emirdağ Lahikası-1',
    section: '03 Emirdağ Lâhikası - I s.31-50',
  },
  {
    id: 'ed1-04',
    text: 'Birincisi: Sizin fütursuz hizmet-i Nuriyede çalışmanız, benim bütün musibetlerimi ve sıkıntılarımı hiçe indiriyor bilakis sürurlara kalbediyor.',
    book: 'Emirdağ Lahikası-1',
    section: '08 Emirdağ Lâhikası - I s.131-150',
  },
  {
    id: 'ed1-05',
    text: 'Risale-i Nur’un şiddetli tokat vurduğu ve hücum ettiği felsefe ise mutlak değildir, belki muzır kısmınadır.',
    book: 'Emirdağ Lahikası-1',
    section: '10 Emirdağ Lâhikası - I s.170-190',
  },
  {
    id: 'ed1-06',
    text: 'Sâlisen: Zülfikar’ın makine ile hitama yaklaşması, Nurcular belki bütün memleket için bir saadettir.',
    book: 'Emirdağ Lahikası-1',
    section: '11 Emirdağ Lâhikası - I s.190-211',
  },
  {
    id: 'ed1-07',
    text: 'Gerçi Risale-i Nur sırf âhirete bakar, gayesi rıza-yı İlahî ve imanı kurtarmak ve şakirdlerinin ise kendilerini ve vatandaşlarını idam-ı ebedîden ve ebedî haps-i münferidden kurtarmaya çalışmaktır.',
    book: 'Emirdağ Lahikası-1',
    section: '02 Emirdağ Lâhikası - I s.10-31',
  },
  {
    id: 'ed1-08',
    text: 'Madem hakikat budur, adliyelerin değil beni ve onları itham etmek belki Risale-i Nur’u ve şakirdlerini himaye etmek en birinci vazifeleridir.',
    book: 'Emirdağ Lahikası-1',
    section: '02 Emirdağ Lâhikası - I s.10-31',
  },
  {
    id: 'ed1-09',
    text: 'Tarîkatsız cennete gidenler çoktur, imansız cennete giden yoktur.” diye bütün kuvvetimizle imana çalışmışız.',
    book: 'Emirdağ Lahikası-1',
    section: '02 Emirdağ Lâhikası - I s.10-31',
  },
  {
    id: 'ed1-10',
    text: 'Endişe ettim, kalben dedim: Risale-i Nur umum memleketle, belki Kur’an hesabına küre-i arzla o derece alâkadardır ki onun başına gelen beladan, musibetten bulutlar dahi kan ağlıyorlar.',
    book: 'Emirdağ Lahikası-1',
    section: '02 Emirdağ Lâhikası - I s.10-31',
  },
  {
    id: 'ed2-01',
    text: 'Olsa olsa o cinayete bir nevi tarafgirlikle yalnız manevî günahkâr olup âhirette mes’ul olur, dünyada değil.',
    book: 'Emirdağ Lahikası-2',
    section: '04 Emirdağ Lâhikası - II s.70-90',
  },
  {
    id: 'ed2-02',
    text: 'Hem Risale-i Nur’un dört esasından bir esası şefkattir ve kadınlar şefkat kahramanı bulunmasından hattâ en korkağı da kahramancasına ruhunu yavrusuna feda eder.',
    book: 'Emirdağ Lahikası-2',
    section: '02 Emirdağ Lâhikası - II s.27-50',
  },
  {
    id: 'ed2-03',
    text: 'Bütün kuvvetleriyle Nur Risalelerini nurlandırmaları ve sahip çıkmaları lâzım ve elzemdir 1.',
    book: 'Emirdağ Lahikası-2',
    section: '03 Emirdağ Lâhikası - II s.51-70',
  },
  {
    id: 'ed2-04',
    text: 'Hem ehl-i tarîkatın en günahkârı dahi çabuk dinsizliğe giremiyor, kalbi mağlup olamıyor.',
    book: 'Emirdağ Lahikası-2',
    section: '03 Emirdağ Lâhikası - II s.51-70',
  },
  {
    id: 'ed2-05',
    text: 'Yalnız mümkün olduğu kadar bid’atlara ve takvayı kıran büyük günahlara girmemek gerektir.',
    book: 'Emirdağ Lahikası-2',
    section: '03 Emirdağ Lâhikası - II s.51-70',
  },
  {
    id: 'ed2-06',
    text: 'Risale-i Nur suallere ihtiyaç bırakmıyor ve benim bedelime her şeye cevap veriyor.',
    book: 'Emirdağ Lahikası-2',
    section: '03 Emirdağ Lâhikası - II s.51-70',
  },
  {
    id: 'ed2-07',
    text: 'Cenab-ı Hakk’a hadsiz şükrolsun ki en ziyade Nurların dokunduğu resmî ulema, aleyhinde bulunamadılar.',
    book: 'Emirdağ Lahikası-2',
    section: '04 Emirdağ Lâhikası - II s.70-90',
  },
  {
    id: 'ed2-08',
    text: 'Tâ ki Nur’un en büyük kuvveti olan ihlas-ı hakiki zedelenmesin!” diye kader-i İlahînin şefkatli tokatları olduğuna kat’î kanaat ediyorum.',
    book: 'Emirdağ Lahikası-2',
    section: '04 Emirdağ Lâhikası - II s.70-90',
  },
  {
    id: 'ed2-09',
    text: 'Mademki nur-u hakikat, imana muhtaç gönüllerde tesirini yapıyor; bir Said değil, bin Said feda olsun.',
    book: 'Emirdağ Lahikası-2',
    section: '04 Emirdağ Lâhikası - II s.70-90',
  },
  {
    id: 'ed2-10',
    text: 'Hem rahmet ve şefkatin hakikati, dirilmemek üzere ölmekle kabil-i tevfik değildir.',
    book: 'Emirdağ Lahikası-2',
    section: '05 Emirdağ Lâhikası - II s.91-109',
  },
  {
    id: 'kl-01',
    text: 'İşte buna binaen, değil yalnız hayat-ı uhreviyenin belki dünyadaki hayatın dahi saadet ve lezzetini isteyenler –hadsiz tecrübelerle– Risale-i Nur’un imanî ve Kur’anî derslerinde bulabilirler ve buluyorlar.',
    book: 'Kastamonu Lahikası',
    section: '06 Kastamonu Lâhikası s.91-109',
  },
  {
    id: 'kl-02',
    text: 'Hem Risaletü’n-Nur, en evvel tercümanının nefsini iknaya çalışır, sonra başkalara bakar.',
    book: 'Kastamonu Lahikası',
    section: '02 Kastamonu Lâhikası s.10-30',
  },
  {
    id: 'kl-03',
    text: 'Belki hem kalbe hem ruha hem sırra hem öyle letaife sirayet ediyor, kökleşiyor ki şeytanın eli o yerlere yetişemiyor; öylelerin imanı zevalden mahfuz kalıyor.',
    book: 'Kastamonu Lahikası',
    section: '02 Kastamonu Lâhikası s.10-30',
  },
  {
    id: 'kl-04',
    text: 'Hem Risaletü’n-Nur’un talebeleri bu zamanda her cihetten ziyade hücuma maruz iman hususunda birbirine selâmet-i iman hakkındaki samimi, masum lisanlarıyla dualarının yekûnü öyle bir kuvvettedir ki rahmet ve hikmet onun reddine müsaade etmezler.',
    book: 'Kastamonu Lahikası',
    section: '02 Kastamonu Lâhikası s.10-30',
  },
  {
    id: 'kl-05',
    text: 'Birincisi: Risale-i Nur’a intisap eden zatın en ehemmiyetli vazifesi, onu yazmak veya yazdırmaktır ve intişarına yardım etmektir.',
    book: 'Kastamonu Lahikası',
    section: '02 Kastamonu Lâhikası s.10-30',
  },
  {
    id: 'kl-06',
    text: 'Evet, elması bildiği (âhiret ve iman gibi) halde, yalnız zaruret-i kat’iye suretinde şişeyi (dünya ve mal gibi) ona tercih etmek ruhsat-ı şer’iye var.',
    book: 'Kastamonu Lahikası',
    section: '03 Kastamonu Lâhikası s.30-51',
  },
  {
    id: 'kl-07',
    text: 'Belki Risale-i Nur şakirdlerinin taifesi ne kadar devam edeceğini düşündüğüme binaen ihtar edildi.',
    book: 'Kastamonu Lahikası',
    section: '03 Kastamonu Lâhikası s.30-51',
  },
  {
    id: 'kl-08',
    text: 'Halbuki ben lillahi’l-hamd Risale-i Nur’un irşadıyla, hakaik-i imaniye ve Kur’aniyeyi bütün kâinatın fevkinde gördüğümden ve itikad ettiğimden, değil küre-i arzdaki cereyanlara, belki bana verilse de bütün dünya saltanatına da âlet edemem.',
    book: 'Kastamonu Lahikası',
    section: '03 Kastamonu Lâhikası s.30-51',
  },
  {
    id: 'kl-09',
    text: 'Eğer aşsa ve taşsa o şefkat, elbette merhamet ve şefkat değildir; belki dalalete ve ilhada sirayet eden bir maraz-ı ruhî ve bir sekam-ı kalbîdir.',
    book: 'Kastamonu Lahikası',
    section: '04 Kastamonu Lâhikası s.52-69',
  },
  {
    id: 'kl-10',
    text: 'Sâniyen: Sizin bu defa nurlu hediyelerinizin her harfine mukabil, Cenab-ı Erhamü’r-Râhimîn defter-i a’malinize bin hasene yazsın ve Âsım’ın ruhuna bin rahmet versin, âmin!',
    book: 'Kastamonu Lahikası',
    section: '05 Kastamonu Lâhikası s.70-91',
  },
  {
    id: 'kk-01',
    text: 'Hem insan yalnız akıldan ibaret değildir; kalp, ruh, sır ve vicdan gibi manevî latîfe ve cihazata da mâliktir.',
    book: 'Küçük Kitaplar',
    section: '04 NUR’UN İLK KAPISI',
  },
  {
    id: 'kk-02',
    text: 'Bu vaziyetten anlaşılıyor ki biz yalnız bu asırda Kur’an’ın yüksek ve parlak bir tefsiri ve kâinatta en yüksek olan iman hakikatlerini beyan eden Risale-i Nur’u okuyoruz.',
    book: 'Küçük Kitaplar',
    section: '05 NUR ÇEŞMESİ',
  },
  {
    id: 'kk-03',
    text: 'Güneş gibi hakikat-i imaniye ve Kur’aniye yerdeki muvakkat ışıkların cazibesine tabi ve âlet olmadığı gibi o hakikati tanıyan, Risale-i Nur’u değil dünya cereyanlarına belki kâinata da âlet edemez.',
    book: 'Küçük Kitaplar',
    section: '05 NUR ÇEŞMESİ',
  },
  {
    id: 'kk-04',
    text: 'Birinci Hakikat: Mecmuda bir kuvvet bulunur, hiçbir fert o kuvvete mâlik olamaz.',
    book: 'Küçük Kitaplar',
    section: '06 DİVAN-I HARB-İ ÖRFÎ',
  },
  {
    id: 'kk-05',
    text: 'Kudret-i ezeliye zatiyedir, lâzımedir, zaruriyedir; acz tahallül edemez, meratib olamaz, her şey ona nisbeten müsavidir.',
    book: 'Küçük Kitaplar',
    section: '07 HUTBE-İ ŞAMİYE',
  },
  {
    id: 'kk-06',
    text: 'Hem dünyada yalnız zayıf gölgeleri gösterilen esma, o cennetin âyinelerinde en şaşaalı bir surette gösterilecektir.',
    book: 'Küçük Kitaplar',
    section: '09 GENÇLİK REHBERİ',
  },
  {
    id: 'kk-07',
    text: 'Değil topraklarımızda, bütün dünyada Nurlarımızla beraber zaferlerden zaferlere gideceğimize inanıyoruz.',
    book: 'Küçük Kitaplar',
    section: '10 HANIMLAR REHBERİ',
  },
  {
    id: 'kk-08',
    text: 'Nev-i beşere rahmet olan Kur’an ancak umumun, lâekall ekseriyetin saadetini tazammun eden bir medeniyeti kabul eder.',
    book: 'Küçük Kitaplar',
    section: '01 SÜNUHAT',
  },
  {
    id: 'kk-09',
    text: 'Çünkü haccın ve ondaki hikmetin ihmali, musibeti değil, gazap ve kahrı celbetti.',
    book: 'Küçük Kitaplar',
    section: '01 SÜNUHAT',
  },
  {
    id: 'kk-10',
    text: 'Halbuki Kur’an haricinde hiçbir akıl ve hikmet ve hiçbir ilim ve felsefe o yolun zulümatını izale edecek bir nur ve o uzun sefere zâd olacak bir rızık vermiyor.',
    book: 'Küçük Kitaplar',
    section: '04 NUR’UN İLK KAPISI',
  },
  {
    id: 'm-01',
    text: 'Elbette o Zat-ı Zülcelal’in kudret ve hikmetinden uzak değildir ki küre-i arzın kalbindeki cehennem-i suğra çekirdeğinde cehennem-i kübrayı saklasın.',
    book: 'Mektubat',
    section: '01 Birinci Mektup',
  },
  {
    id: 'm-02',
    text: 'Değil zahirî bir tasallut, belki akılları, ruhları, kalpleri, nefisleri fetih ve teshir ediyor.',
    book: 'Mektubat',
    section: '19 On Dokuzuncu Mektup',
  },
  {
    id: 'm-03',
    text: 'Bu iki nur-u a’zam olan isimlere yetişmek için en mühim bulduğum vesile; fakr ile şükür, acz ile şefkattir.',
    book: 'Mektubat',
    section: '08 Sekizinci Mektup',
  },
  {
    id: 'm-04',
    text: 'Amma bazı müfrit fikirli ehl-i keşfin hükmettikleri fena-yı mutlak ise hakikat değildir.',
    book: 'Mektubat',
    section: '15 On Beşinci Mektup',
  },
  {
    id: 'm-05',
    text: 'Çünkü Zat-ı Akdes-i İlahî madem sermedî ve daimîdir, elbette sıfâtı ve esması dahi sermedî ve daimîdirler.',
    book: 'Mektubat',
    section: '15 On Beşinci Mektup',
  },
  {
    id: 'm-06',
    text: 'Beşinci Nokta: Rahmet-i İlahiyenin en latîf, en güzel, en hoş, en şirin cilvelerinden olan şefkat; bir iksir-i nuranidir.',
    book: 'Mektubat',
    section: '17 On Yedinci Mektup',
  },
  {
    id: 'm-07',
    text: 'Demek, bütün ahval ve keşfiyatın ve ezvak ve müşahedatın mizanı, Kitap ve Sünnettir.',
    book: 'Mektubat',
    section: '18 On Sekizinci Mektup',
  },
  {
    id: 'm-08',
    text: 'Belki nasıl ki o zat, hidayetiyle saadet-i ebediyenin sebeb-i husulü ve vesile-i vusulüdür.',
    book: 'Mektubat',
    section: '19 On Dokuzuncu Mektup',
  },
  {
    id: 'm-09',
    text: 'Ve ruh-u beşer için en hâlis sürur ve kalb-i insan için en safi sevinç, o muhabbetullah içindeki lezzet-i ruhaniyedir.',
    book: 'Mektubat',
    section: '20 Yirminci Mektup',
  },
  {
    id: 'm-10',
    text: 'Evet, bütün hakiki saadet ve hâlis sürur ve şirin nimet ve safi lezzet, elbette marifetullah ve muhabbetullahtadır.',
    book: 'Mektubat',
    section: '20 Yirminci Mektup',
  },
  {
    id: 'mn-02',
    text: 'İkincisi hakiki tevhiddir ki: “Allah birdir, mülk onundur, vücud onundur, her şey onundur.” der; lâyetezelzel bir itikada sahiptirler.',
    book: 'Mesnevî-i Nuriye',
    section: '03 Lem’alar Risalesi',
  },
  {
    id: 'mn-03',
    text: 'Zerrelerden tut seyyarelere kadar ve nakışlardan şemslere varıncaya kadar her şey, zatında, hakikatinde sabit olan “acz ve fakr”ın lisan-ı haliyle Sâni’in vücub-u vücudunu ilan eder.',
    book: 'Mesnevî-i Nuriye',
    section: '03 Lem’alar Risalesi',
  },
  {
    id: 'mn-04',
    text: 'Ve keza o zatın en yüksek derecede bulunan zühd ve takva ve ubudiyeti şehadetleriyle mâlik olduğu kuvvet-i imaniye ile musaddaktır.',
    book: 'Mesnevî-i Nuriye',
    section: '04 Reşhalar',
  },
  {
    id: 'mn-05',
    text: 'Kâinatın bütün zerratı müctemian ve münferiden lisan-ı acz ve fakr ile vücub-u vücud ve vahdetine şehadet ettikleri Sâni’-i Hakîm’e hamdler, senalar, şükürler olsun.',
    book: 'Mesnevî-i Nuriye',
    section: '05 Lâsiyyemalar',
  },
  {
    id: 'mn-06',
    text: 'Tartılmış gibi gayet mizanlı olmakla beraber, mu’cizane bir sürat-i mutlaka, her şeyi emrine ve kudretine teshir eden zata mahsustur.',
    book: 'Mesnevî-i Nuriye',
    section: '05 Lâsiyyemalar',
  },
  {
    id: 'mn-07',
    text: 'Bu zıtları bir fiilinde cem etmek ancak kudreti hadsiz bir Sâni’-i Kadîr’e mahsustur.',
    book: 'Mesnevî-i Nuriye',
    section: '05 Lâsiyyemalar',
  },
  {
    id: 'mn-08',
    text: 'Eğer âhiretin hesapsız esbab-ı mûcibesi, delail-i vücudu olmasa idi, yalnız şu zatın tek duası, baharımızın icadı kadar Hâlık-ı Rahîm’in kudretine hafif gelen şu cennetin binasına sebebiyet verecekti.',
    book: 'Mesnevî-i Nuriye',
    section: '05 Lâsiyyemalar',
  },
  {
    id: 'mn-09',
    text: 'Evet kudret-i ezeliyeye nisbetle, ölümden sonra haşrin gelmesi, güzden sonra baharın gelmesi gibidir.',
    book: 'Mesnevî-i Nuriye',
    section: '05 Lâsiyyemalar',
  },
  {
    id: 'mn-10',
    text: 'Evet, geçmiş zamanda vukua gelmiş olan mu’cizat-ı kudret, Sâni’in bütün imkânat-ı istikbaliyeye kādir olduğuna kat’î şahit ve bürhanlardır.',
    book: 'Mesnevî-i Nuriye',
    section: '05 Lâsiyyemalar',
  },
  {
    id: 'mh-01',
    text: 'Hadd-i evsatı gösterecek, ifrat ve tefriti kıracak yalnız felsefe-i şeriatla belâgat ve mantık ile hikmettir.',
    book: 'Muhakemat',
    section: '01 Birinci Makale',
  },
  {
    id: 'mh-02',
    text: 'Unsuriyet ve besatet ve erbaiyet, felsefenin bataklığındandır, şeriatın maden-i safisinden değildir.',
    book: 'Muhakemat',
    section: '01 Birinci Makale',
  },
  {
    id: 'mh-03',
    text: 'Evet, Rabb-i İzzet’in kelâmına dikkat edilse bu hakikat her yerde nur gibi parlar.',
    book: 'Muhakemat',
    section: '02 İkinci Makale',
  },
  {
    id: 'mh-04',
    text: 'Sırr-ı hikmet dahi ademü’l-abesiyeti ve Sâni’in hikmeti, masnûdaki teennuku kendine şahit gösterir.',
    book: 'Muhakemat',
    section: '03 Üçüncü Makale',
  },
  {
    id: 'mh-05',
    text: 'Bir gayr-ı müslim yalnız mescide girmekle Müslüman olmasına kâfi olmadığı gibi; tefsirin veya şeriatın kitaplarına, hikmet veya coğrafya veya tarih gibi bir fennin meselesi girmesiyle tefsir veya şeriat olamaz.',
    book: 'Muhakemat',
    section: '01 Birinci Makale',
  },
  {
    id: 'mh-06',
    text: 'Tenbih: Mehasin-i medeniyet denilen emirler, şeriatın başka şekle çevrilmiş birer meselesidir.',
    book: 'Muhakemat',
    section: '01 Birinci Makale',
  },
  {
    id: 'mh-07',
    text: 'Kur’an’ın gösterdiği vesailiyle, doğru hikmetin kuvvetiyle, bir seyr-i ruhanî olarak semavatın ulûmlarına çıkacağım.',
    book: 'Muhakemat',
    section: '01 Birinci Makale',
  },
  {
    id: 'mh-08',
    text: 'Zira hikmet-i atîka burçları semada, hikmet-i cedide ise medar-ı arzda farz etmişlerdir.',
    book: 'Muhakemat',
    section: '01 Birinci Makale',
  },
  {
    id: 'mh-09',
    text: 'Tâ nefis ve mallarıyla cennete müşteri olanların rağabatını tehyic ve iştihalarını açsın.',
    book: 'Muhakemat',
    section: '01 Birinci Makale',
  },
  {
    id: 'mh-10',
    text: 'Fakat felsefenin yanlışı, seleflerimizin lisanlarına girdiğinden bir mahmil-i sahih bulmuştur.',
    book: 'Muhakemat',
    section: '01 Birinci Makale',
  },
  {
    id: 'st-01',
    text: 'Bundan anlaşılıyor ki o tevafuk tesadüfî değil; bu rahmet, Isparta’ya rahmet olan Risale-i Nur’a bakıyor.',
    book: 'Sikke-i Tasdik-i Gaybî',
    section: '01 Parlak Fıkralar ve Güzel Mektuplar 1',
  },
  {
    id: 'st-02',
    text: 'Risaletü’n-Nur’un mümtaz bir hâsiyeti, imanın en son ve en küllî istinad noktasını, kavî ve kat’î beyan edildiğinden bu hâsiyet Âyetü’l-Kübra Risalesi’nde fevkalâde parlak görünüyor.',
    book: 'Sikke-i Tasdik-i Gaybî',
    section: '01 Parlak Fıkralar ve Güzel Mektuplar 1',
  },
  {
    id: 'st-03',
    text: 'Bu hâdise, Risale-i Nur’un sadık ve ihlaslı şakirdleri daima bir hıfz-ı inayet ve himayet altında olduklarına şüphe bırakmıyor.',
    book: 'Sikke-i Tasdik-i Gaybî',
    section: '01 Parlak Fıkralar ve Güzel Mektuplar 1',
  },
  {
    id: 'st-04',
    text: 'Elbette âyetin delâlet-i zımnî ile Risale-i Nur’a kuvvetli karinelerle işareti kat’îdir, şüphe edilmemek gerektir.',
    book: 'Sikke-i Tasdik-i Gaybî',
    section: '01 Parlak Fıkralar ve Güzel Mektuplar 1',
  },
  {
    id: 'st-05',
    text: 'Yani nur-u İlahînin veya nur-u Kur’anînin veya nur-u Muhammedînin (asm) misali, şuمِشْكٰوةٍ فٖيهَا مِصْبَاحٌ dur.',
    book: 'Sikke-i Tasdik-i Gaybî',
    section: '02 Birinci Şuâ',
  },
  {
    id: 'st-06',
    text: 'Birden hatıra geldi ki: Bu üç farkın sırrı ise Risaletü’n-Nur’un mertebesi üçüncüde olmasıdır.',
    book: 'Sikke-i Tasdik-i Gaybî',
    section: '02 Birinci Şuâ',
  },
  {
    id: 'st-07',
    text: 'Risale-i Nur’un mecmuundan haber veren sarîh fıkralar dahi her birisine kuvvetli bir karinedir.',
    book: 'Sikke-i Tasdik-i Gaybî',
    section: '03 Sekizinci Şuâ',
  },
  {
    id: 'st-08',
    text: 'Hem çabuk hem herkes anlayacak bir tarzda en derin hakikatleri talim eden Risale-i Nur, elbette İmam-ı Ali radıyallahu anhın bu iltifatına lâyıktır.',
    book: 'Sikke-i Tasdik-i Gaybî',
    section: '03 Sekizinci Şuâ',
  },
  {
    id: 'st-09',
    text: 'İşte bu halet-i ruhiye ile yalnız hakaik-i imaniyenin tercümanı olan Risale-i Nur’un doğru ve hak olduğuna latîf bir münasebet söyleyeceğim.',
    book: 'Sikke-i Tasdik-i Gaybî',
    section: '03 Sekizinci Şuâ',
  },
  {
    id: 'st-10',
    text: 'Sâniyen: Yerde Allah Allah denilmeyecekten murad, Allah’a iman kalkacak demek değildir.',
    book: 'Sikke-i Tasdik-i Gaybî',
    section: '06 Sekizinci Lem’a',
  },
  {
    id: 's-01',
    text: 'Elbette o hakikat-i âliye; bu fâni, kısacık, noksan, elemli hayat-ı dünyeviyeye münhasır değildir.',
    book: 'Sözler',
    section: '10 Onuncu Söz',
  },
  {
    id: 's-02',
    text: 'Felsefe hikmeti ise bütün hârikulâde olan mu’cizat-ı kudreti, âdet perdesi içinde saklayıp cahilane ve lâkaydane üstünde geçer.',
    book: 'Sözler',
    section: '13 On Üçüncü Söz',
  },
  {
    id: 's-03',
    text: 'Belki doğrudan doğruya Cenab-ı Mün’im-i Muhyî ve Rahman ve Rahîm olan Zat-ı Zülcelal perdesiz, elinde tutacak; tâ her vakit dua ve şükür kapılarını açık bırakacak.',
    book: 'Sözler',
    section: '16 On Altıncı Söz',
  },
  {
    id: 's-04',
    text: 'Huruf ve kelimatı nefislerine değil belki başkasının zat ve sıfât ve esmasına delâlet ediyorlar.',
    book: 'Sözler',
    section: '17 On Yedinci Söz',
  },
  {
    id: 's-05',
    text: 'Hem saadet-i ebediyenin kapısını açacak bir anahtar beraber olduğu için Cenab-ı Hak kendi zatını bütün eşyayı işitir ve görür sıfatıyla tavsif eder.',
    book: 'Sözler',
    section: '25 Yirmi Beşinci Söz',
  },
  {
    id: 's-06',
    text: 'Hak olup Hak’tan gelip Hak diyen ve hakikati gösteren ve nurani hikmeti neşreden odur.',
    book: 'Sözler',
    section: '07 Yedinci Söz',
  },
  {
    id: 's-07',
    text: 'İşte “Fenalığı kendinden, iyiliği Allah’tan bil.” olan hükm-ü Kur’anînin sırrı zahir oluyor.',
    book: 'Sözler',
    section: '08 Sekizinci Söz',
  },
  {
    id: 's-08',
    text: 'Elbette âdil olan o Zat-ı Celil-i Zülcemal’in ve Hakîm olan o Zat-ı Cemil-i Zülcelal’in daimî bir cehennemi ve ebedî bir cenneti bulunacaktır.',
    book: 'Sözler',
    section: '10 Onuncu Söz',
  },
  {
    id: 's-09',
    text: 'Madem Kadîr-i Mutlak’ın kudreti zatîdir, mümkinat gibi ârızî değildir ve kemal-i mutlaktadır.',
    book: 'Sözler',
    section: '10 Onuncu Söz',
  },
  {
    id: 's-10',
    text: 'Çünkü bu zatın bütün hayatında bütün davaları, vahdaniyetten sonra haşirde temerküz ediyor.',
    book: 'Sözler',
    section: '10 Onuncu Söz',
  },
  {
    id: 'su-01',
    text: 'Belki her bir zîhayatın acayip cihazatı dahi kemal-i mutlakta bir kudreti iktiza eder.',
    book: 'Şuâlar',
    section: '02 İkinci Şuâ',
  },
  {
    id: 'su-02',
    text: 'Umum âlem-i İslâm’ı alâkadar eden bir hakikatin hatırı için değil yalnız dünya hayatını, belki lüzum olsa uhrevî hayatımı ve saadetimi dahi ehl-i imanın Risale-i Nur ile saadetleri için feda etmeyi nefsim de kabul ediyor.',
    book: 'Şuâlar',
    section: '12 On Üçüncü Şuâ',
  },
  {
    id: 'su-03',
    text: 'Gafleti dağıtacak bir intibah-ı ruhî vasıtasıyla, kabir tam manasıyla, ölüm bütün çıplaklığıyla ve zeval ve fena ağlattırıcı levhalarıyla bana göründü.',
    book: 'Şuâlar',
    section: '02 İkinci Şuâ',
  },
  {
    id: 'su-04',
    text: 'Ben de âyetten bu dersimi aldıkça öyle bir kuvve-i maneviyeyi buldum ki değil şimdiki düşmanlarıma belki dünyaya meydan okutturabilir bir iktidar-ı imanî hissederek bütün ruhum ile حَسْبُنَا اللّٰهُ وَنِعْمَ الْوَكٖيلُ dedim.',
    book: 'Şuâlar',
    section: '04 Dördüncü Şuâ',
  },
  {
    id: 'su-05',
    text: 'Bütün hayırlar, iyilikler, güzellikler, lezzetler –tahlil neticesinde– vücuddan neş’et ettiklerini ve bütün fenalıklar, şerler, musibetler, elemler hattâ masiyetler ademe râci olduğunu ehl-i akıl ve ehl-i kalbin büyükleri ittifak etmişler.',
    book: 'Şuâlar',
    section: '04 Dördüncü Şuâ',
  },
  {
    id: 'su-06',
    text: 'Onun için hadsiz salavat ve rahmet dualarını bütün ümmetten istemesi ayn-ı hikmettir.',
    book: 'Şuâlar',
    section: '06 Altıncı Şuâ',
  },
  {
    id: 'su-07',
    text: 'Bu âyet-i uzmanın sırrıyla, insanın bu dünyaya gönderilmesinin hikmeti ve gayesi; Hâlık-ı kâinat’ı tanımak ve ona iman edip ibadet etmektir.',
    book: 'Şuâlar',
    section: '07 Yedinci Şuâ',
  },
  {
    id: 'su-08',
    text: 'Kapısı kapanmayan kabir, daima idamını o münkire ihtar etmekle, lezzetli hayatını elîm elemlerle zehirliyor.',
    book: 'Şuâlar',
    section: '07 Yedinci Şuâ',
  },
  {
    id: 'su-09',
    text: 'İşte böyle dünyayı ve âhireti ve her şeyi kaplamış bir rahmet, elbette o rahmet, vâhidiyet içinde bir ehadiyetin cilvesidir.',
    book: 'Şuâlar',
    section: '07 Yedinci Şuâ',
  },
  {
    id: 'su-10',
    text: 'Elbette o rububiyetin haşmetini sukuttan ve hikmetini abesiyetten ve şefkatini gadirden kurtaran, ebedî bir dâr-ı saadet bulunacak ve girilecek.',
    book: 'Şuâlar',
    section: '09 Dokuzuncu Şuâ',
  },
  {
    id: 'th-01',
    text: 'Hem müteaddid risalelerde yazmışım ki: “Tarîkat zamanı değil belki imanı kurtarmak zamanıdır.',
    book: 'Tarihçe-i Hayat',
    section: '04 Eskişehir Hayatı',
  },
  {
    id: 'th-02',
    text: 'Belki de kader-i İlahînin bizi bu dershaneye sevk etmesinin bir hikmeti de budur.',
    book: 'Tarihçe-i Hayat',
    section: '08 Afyon Hayatı',
  },
  {
    id: 'th-03',
    text: 'Risale-i Nur, yirminci asrın ilim ve fen seviyesine uygun müsbet bir metotla akla ve kalbe hitap ederek ikna ve ispat yoluyla gittiği için yalnız Türkiye’de değil, hariç memleketlerde de hüsn-ü kabule mazhar olmuştur.',
    book: 'Tarihçe-i Hayat',
    section: '10 Hariç Memleketler',
  },
  {
    id: 'th-04',
    text: 'Ve artık ruhun maddeye, hakkın bâtıla, nurun zulmete, imanın küfre her zaman galebe çalacağı; ezelden ebede değişmeyecek olan İlahî kanunların başında gelen bir hakikat olduğu, güneşler gibi belirdi.',
    book: 'Tarihçe-i Hayat',
    section: '01 Ön söz',
  },
  {
    id: 'th-05',
    text: 'İşte Risale-i Nur Külliyatı’nın mazhar olduğu İlahî fütuhat, hep bu enbiya mesleğinde sebat kahramanlığının şaheser misali ve hârikulâde neticesidir.',
    book: 'Tarihçe-i Hayat',
    section: '01 Ön söz',
  },
  {
    id: 'th-06',
    text: 'Sâniyen, mal ve servet bana lezzet vermiyor, dünyaya ancak bir misafirhane nazarıyla bakıyorum.” derdi.',
    book: 'Tarihçe-i Hayat',
    section: '02 İlk Hayatı',
  },
  {
    id: 'th-07',
    text: 'Risale-i Nur’un yüzer hüccetlerle ispat ettiği bir hakikati ki bu risalenin mukaddimesinde bir iki misali söylenmiş.',
    book: 'Tarihçe-i Hayat',
    section: '02 İlk Hayatı',
  },
  {
    id: 'th-08',
    text: 'Bütün maddî ve manevî zulmetleri izale edip âlemi nuruyla ziyalandıracak olan Risale-i Nur meydana çıkıyor, dünya ilim ve irfan sahasına Türkiye’den bir güneş doğuyor!..',
    book: 'Tarihçe-i Hayat',
    section: '03 Barla Hayatı',
  },
  {
    id: 'th-09',
    text: 'Risale-i Nur, iman ve Kur’an muhaliflerine karşı mücadelesinde cebir ve münazaa yolunu değil, ikna ve ispat yolunu ihtiyar etmiştir.',
    book: 'Tarihçe-i Hayat',
    section: '03 Barla Hayatı',
  },
  {
    id: 'th-10',
    text: 'Risale-i Nur yüz otuz risalelerinde, doğrudan doğruya hakikatin berrak vechesini bütün vuzuh ve çıplaklığıyla göstermiştir.',
    book: 'Tarihçe-i Hayat',
    section: '03 Barla Hayatı',
  },
  {
    id: 'ii-01',
    text: 'Ancak dünyada şedit bir elemi, âhirette de en şedit bir azabı intac edecek bir dalalettir.',
    book: "İşârât-ül İ'caz",
    section: '10 Bakara Suresi 9-10. âyetler',
  },
  {
    id: 'ii-02',
    text: 'Ancak bütün siyasîlerin hikmetini ve hükemanın akıllarını zerrelerde farz etmekle eblehane kabul eder.',
    book: "İşârât-ül İ'caz",
    section: '16 Bakara Suresi 21-22. âyetler',
  },
  {
    id: 'ii-03',
    text: 'Nereye gidiyorlar?” diye ahvallerini anlamak üzere hilkat hükûmeti, fenn-i hikmeti karşılarına çıkardı.',
    book: "İşârât-ül İ'caz",
    section: '04 Fatiha Suresi',
  },
  {
    id: 'ii-04',
    text: 'Evet, rahmetin rahmet olması ve nimetin nimet olması ancak ve ancak haşir ve saadet-i ebediyeye bağlıdır.',
    book: "İşârât-ül İ'caz",
    section: '04 Fatiha Suresi',
  },
  {
    id: 'ii-05',
    text: 'Ve keza Sâni’-i Hakîm’in rahmet hazinesinin mahall-i sarfı ancak kıyamet ve haşirdir.',
    book: "İşârât-ül İ'caz",
    section: '06 Bakara Suresi 4-5. âyetler',
  },
  {
    id: 'ii-06',
    text: 'İşte bunların her birisi haşr-i cismanînin arkasındaki saadet-i ebediyeye, şehadet parmaklarını uzatarak gösteriyorlar.',
    book: "İşârât-ül İ'caz",
    section: '06 Bakara Suresi 4-5. âyetler',
  },
  {
    id: 'ii-07',
    text: 'Yedinci Bürhan: Evet, Rahman ve Rahîm olan Sâni’-i Hakîm’in rahmeti, rahmetlerin en büyüğü olan saadet-i ebediyenin geleceğini tebşir ediyor.',
    book: "İşârât-ül İ'caz",
    section: '06 Bakara Suresi 4-5. âyetler',
  },
  {
    id: 'ii-08',
    text: 'Çünkü bütün nimetlerin, rahatların, lezzetlerin ruhu olan saadet-i ebediye gelmezse umum kâinatın şehadetiyle sabit olan ve güneş gibi parlayan rahmet ve şefkat-i İlahiyenin bedahetine karşı mükâbere ile inkâr lâzım gelir.',
    book: "İşârât-ül İ'caz",
    section: '06 Bakara Suresi 4-5. âyetler',
  },
  {
    id: 'ii-09',
    text: 'Rahmet-i İlahiyenin en latîfi en zarifi en lezizi olan muhabbet ve şefkate bakınız.',
    book: "İşârât-ül İ'caz",
    section: '06 Bakara Suresi 4-5. âyetler',
  },
  {
    id: 'ii-10',
    text: 'Evet, onlar iman etmediklerinden ve cevher-i ruhu ifsad ve bütün elemleri içine alan küfür musibetine maruz kaldıklarından لَمْ يُؤْمِنُوا ya bedel كَفَرُوا tabiriyle işaret edilmiştir.',
    book: "İşârât-ül İ'caz",
    section: '07 Bakara Suresi 6. âyet',
  },
  {
    id: 'l-01',
    text: 'Binaenaleyh Risale-i Nur’dan bendeniz değil, hiçbir talebeniz o mübarek elmastan ve lezzetten ayrılamaz.',
    book: "Lem'alar",
    section: '28 Yirmi Sekizinci Lem’a',
  },
  {
    id: 'l-02',
    text: 'Belki inşâallah o hâdise, onun kalbini dünyadan kurtarıp tamamıyla Kur’an’a vermek için bir ameliyat-ı cerrahiye-i nâfia hükmüne geçer.',
    book: "Lem'alar",
    section: '10 Onuncu Lem’a',
  },
  {
    id: 'l-03',
    text: 'Evet, şeriat-ı Muhammediye ve sünnet-i Ahmediyede hiçbir mesele yoktur ki müteaddid hikmetleri bulunmasın.',
    book: "Lem'alar",
    section: '11 On Birinci Lem’a',
  },
  {
    id: 'l-04',
    text: 'Şöyle ki şu âyet diyor ki “Allah’a (Celle Celalühü) imanınız varsa elbette Allah’ı seveceksiniz.',
    book: "Lem'alar",
    section: '11 On Birinci Lem’a',
  },
  {
    id: 'l-05',
    text: 'Marziyatı ise en mükemmel bir surette Zat-ı Muhammediye’de (asm) tezahür ediyor.',
    book: "Lem'alar",
    section: '11 On Birinci Lem’a',
  },
  {
    id: 'l-06',
    text: 'Madem nass-ı kelâmıyla; onun muhabbetine, yalnız ittiba-ı sünnet-i Ahmediye (asm) ile mazhar olunur.',
    book: "Lem'alar",
    section: '11 On Birinci Lem’a',
  },
  {
    id: 'l-07',
    text: 'Belki âyâtın yıldızlarına, hikmet-i hakikiyenin mi’racıyla ve iman ve İslâmiyet’in kanatlarıyla çıkılabilir.',
    book: "Lem'alar",
    section: '12 On İkinci Lem’a',
  },
  {
    id: 'l-08',
    text: 'Şeytanların bu müthiş tahribatına karşı en mühim silahınız ve cihazat-ı tamiriyeniz, istiğfardır ve “Eûzü billah” demekle Cenab-ı Hakk’a ilticadır.',
    book: "Lem'alar",
    section: '13 On Üçüncü Lem’a',
  },
  {
    id: 'l-09',
    text: 'Çünkü Cenab-ı Hakk’a itikad ve cehennemi tasdik etmek, öyle günahı işlemekle kabil-i tevfik olamaz.',
    book: "Lem'alar",
    section: '13 On Üçüncü Lem’a',
  },
  {
    id: 'l-10',
    text: 'Şu halde kebairi işlemek, imansızlıktan gelmiyor, belki his ve hevesin ve vehmin galebesiyle akıl ve kalbin mağlubiyetinden ileri gelir.',
    book: "Lem'alar",
    section: '13 On Üçüncü Lem’a',
  },
];

/**
 * Get a random quote from the collection.
 * Optionally filter by book.
 */
export function getRandomQuote(bookFilter?: string): Vecize {
  const pool = bookFilter ? VECIZELER.filter((v) => v.book === bookFilter) : VECIZELER;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx] ?? VECIZELER[0]!;
}

/**
 * Get a quote by ID.
 */
export function getQuoteById(id: string): Vecize | undefined {
  return VECIZELER.find((v) => v.id === id);
}

/**
 * Get today's quote — deterministic based on date, changes daily.
 */
export function getDailyQuote(): Vecize {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  const idx = dayOfYear % VECIZELER.length;
  return VECIZELER[idx] ?? VECIZELER[0]!;
}
