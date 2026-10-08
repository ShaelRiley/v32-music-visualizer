import {scene,layer,validateScene} from './scenes.mjs';
// Every row is an authored composition, with explicit operators, relationships,
// apertures, placement roles, choreography and camera. No palette/seed permutations.
const authored={
ribbon:`
Prism Sail|ribbon.fold@body+knot.circulate@core|orbit|An open spectral membrane folds around a circulating knot.|mo
Two Winds|ribbon.split.open@left+ribbon.twist.open@right+helix.ripple@rear|rise|Separate sails part to reveal a helical spine.|obm
Chapel of Folds|ribbon.fold@vault+iris.ripple@core+strata.still@floor|interior|A layered chapel wraps a vibrating aperture above a terraced floor.|mbo
Sewn Horizon|ribbon~weave~weft.twist@body+braid.circulate@rim|orbit|A woven membrane catches a braid along its torn horizon.|tm
Inside the Sail|ribbon~wrap~shell.invert.pores@vault+rosette.grow@core|passage|A perforated enclosing sail inverts around a growing blossom.|tb
Cutwater|ribbon~intersect~cone.ripple@body+cone.split@cross|detail|Conical crossings cut spatial openings through a rippling sail.|bo
Ribbon Weather|ribbon.collapse.bands@ceiling+wave.ripple@floor+spiral.circulate@front|rise|Striped overhead fabric falls toward waves and an approaching coil.|tmb
Sail Nursery|ribbon.grow@rear+cell.split@front+branch.twist@core|hold|A rear sail shelters cells separating around a branching nucleus.|tob`,
torus:`
Chromatic Lock|torus.twist@body+iris.ripple@core|orbit|A thick orbital lock tightens around a ruffled aperture.|bm
Double Gate|torus.split@left+torus.invert@right+knot.circulate@core|passage|Two orbital gates part around a knot in their shared passage.|obm
Orbital Sanctuary|torus.circulate@vault+shell.ripple.pores@core+helix.twist@nest|interior|An orbital enclosure shelters a porous shell and axial filament.|tmb
Woven Orbit|torus~weave~weft.fold@body+weft.split@floor|rise|Interlaced orbital fabric hangs above a separating woven floor.|mo
The Returning Ring|torus~blend~hourglass.invert.open@body+spiral.grow@core|detail|A ring narrows into a waist while its inner coil unfurls.|tb
Interrupted Circuit|torus~intersect~arch.ripple@body+arch.split@cross|orbit|An arch interrupts an orbital circuit with legible black cuts.|bo
Three Orbits|torus.circulate@left+torus.twist@right+lens.ripple@rear|rise|Two distinct orbital planes cross a shallow luminous lens.|bmt
Toroidal Weather|torus.fold.bands@vault+wavefront.ripple@floor+vortex.collapse@core|passage|An orbital canopy folds into annular waves above a collapsing whirl.|mbo`,
shell:`
Porous Sun|shell.ripple.pores@body+spiral.circulate@core|orbit|A porous shell reveals an internal circulating spiral.|bt
Cloven Planet|shell.split.open@left+shell.invert.open@right+weft.fold@rear|rise|Complementary open shells separate in front of a woven plane.|omb
Shell Within Shell|shell.grow.pores@vault+shell.collapse.open@core+iris.ripple@nest|interior|Open concentric shells expose an inner ruffled throat.|tbo
Filament Cradle|shell~wrap~helix.fold.open@body+helix.twist@core|orbit|A helical field wraps the shell supporting its axial filament.|mb
Slow Eversion|shell~blend~rosette.invert@body+lens.circulate@floor|detail|A spherical surface everts toward a petaled dish above a lens.|tm
Punctured Horizon|shell~intersect~catenoid.ripple@body+catenoid.split@cross|passage|A narrow waist pierces a shell and opens a passage.|bo
Shell Choir|shell.ripple@left+cell.grow@right+cone.twist@rear|hold|A resonating shell answers a cell cluster across a conical rear wall.|mbt
Black Pearl Chamber|shell.collapse.pores@vault+crystal.grow@core+knot.circulate@rim|interior|A collapsing chamber reveals a crystal held by a circulating knot.|tbo`,
helix:`
Electric Spine|helix.ripple@body+iris.twist@cross|rise|An ascending helical spine passes through a turning aperture.|bm
Counterwound|helix.twist@left+braid.circulate@right+lens.invert@rear|orbit|A helical column and braid cross opposite sides of a shallow lens.|mot
Spiral Stairwell|helix.fold@vault+arch.still@floor+wavefront.ripple@core|interior|A large coiled stairwell winds above an arch and wave throat.|tbo
Helical Cloth|helix~weave~ribbon.split@body+ribbon.fold@cross|passage|A split helical fabric threads through a folded transverse sail.|om
Axial Unraveling|helix~blend~branch.grow@body+cell.collapse@floor|rise|A coiled axis opens into branching growth over clustered cells.|tb
Coil of Absence|helix~intersect~shell.ripple@body+shell.invert.open@core|detail|A hollowed helical column turns around an open sphere.|bm
Thunder Columns|helix.split@left+helix.collapse@right+strata.fold@rear|hold|Two columns answer impulses against slowly folding terraces.|obt
Helical Observatory|helix.circulate@vault+torus.ripple@core+crystal.twist@nest|interior|A coiled enclosure surrounds an orbital window and turning crystal.|tmb`,
wave:`
Standing Sea|wave.ripple@body+arch.fold@rear|rise|Crossing waves run toward a folded arch on the horizon.|bm
Two Tides|wave.split@floor+wave.invert@ceiling+iris.circulate@core|passage|Floor and ceiling tides part around an annular window.|omt
Submerged Room|wave.fold@vault+strata.collapse@floor+cone.ripple@rear|interior|An undulating enclosure meets terraces and a conical far wall.|tbo
Woven Surf|wave~weave~weft.twist@body+weft.ripple@cross|orbit|Wave fabric weaves through an orthogonal textile sheet.|mb
The Tide Becomes Trees|wave~blend~coral.grow@body+lens.invert@floor|rise|A wavefield rises into coral over a flattening luminous lens.|tm
Wave Window|wave~intersect~torus.ripple@body+torus.split@cross|detail|Orbital cuts turn a wave sheet into a traversable window.|bo
Broken Seas|wave.collapse.bands@left+saddle.fold@right+spiral.circulate@rear|hold|A striped sea faces a saddle while a coil moves between them.|bmt
Resonance Basin|wave.ripple@floor+hourglass.twist@core+rosette.grow@ceiling|passage|Waves collect under a twisting waist and an expanding petaled roof.|bot`,
gyroid:`
Interference Garden|gyroid.ripple@body+branch.grow@core|orbit|An interference membrane rises around a small branching garden.|bt
Split Labyrinth|gyroid.split.open@left+scroll.twist@right+lens.circulate@rear|passage|A perforated interference wall opens beside a rolled scroll.|omb
Gyroid Cathedral|gyroid.fold.pores@vault+iris.ripple@rear+strata.still@floor|interior|An open interference canopy forms a chamber with a ruffled far aperture.|tmb
Knotted Interference|gyroid~wrap~knot.twist@body+knot.circulate@core|orbit|A knotted displacement winds through an interference sheet.|mb
Membrane Metabolism|gyroid~blend~cell.grow@body+coral.collapse@floor|detail|The interference surface fragments toward clustered cellular growth.|tm
Field Aperture|gyroid~intersect~cone.ripple@body+cone.invert@cross|rise|Conical intersections cut negative-space corridors into the field.|bo
Two Frequencies|gyroid.circulate.bands@rear+reaction.ripple@front+helix.split@core|hold|Two dissimilar interference systems exchange pulses around a split coil.|mbo
Within Interference|gyroid.twist.open@vault+vortex.fold@core+wavefront.ripple@floor|interior|A warped interference room encloses a whirl above traveling wave rings.|tmb`,
knot:`
Threefold Current|knot.circulate@body+lens.ripple@core|orbit|A trefoil filament circulates around a shallow lens.|mb
Knots in Conversation|knot.split@left+spiral.grow@right+iris.twist@rear|rise|A parting knot answers an unfurling coil across an aperture.|otm
The Knot Is a Room|knot.fold@vault+shell.ripple.open@core+arch.still@floor|interior|A monumental knot becomes a room around an open shell.|tmb
Knitted Knot|knot~weave~braid.twist@body+braid.split@cross|detail|Interlaced filaments articulate a knot and a separating braid.|mo
Knot Eversion|knot~blend~mobius.invert@body+rosette.grow@floor|orbit|A knot opens toward a one-sided strip above a growing rosette.|tb
Severed Continuity|knot~intersect~lens.ripple@body+lens.split@front|hold|A lens cuts a filament’s continuity into spatially readable gaps.|bo
Filament Throne|knot.collapse@rear+crystal.grow@core+helix.twist@left|rise|A collapsing knot frames a crystal beside a helical pillar.|tmb
Braided Passage|knot.circulate@vault+scroll.fold@left+scroll.invert@right|passage|A surrounding knot ties together oppositely rolled passage walls.|bmt`,
branch:`
Lightning Orchard|branch.grow@body+wavefront.ripple@floor|rise|Branches grow over waves traveling across the orchard floor.|tb
Branching Dialogue|branch.split@left+coral.twist@right+lens.circulate@rear|orbit|A split tree confronts twisting coral across a luminous lens.|omb
Canopy Room|branch.fold@vault+strata.ripple@floor+iris.grow@core|interior|An overhead branching canopy opens over a terraced room.|tmb
Braided Roots|branch~weave~braid.twist@body+braid.ripple@floor|detail|Interwoven roots connect a branching structure to braided ground.|mb
Forest into Cells|branch~blend~cell.collapse@body+shell.grow.pores@rear|passage|Branching paths gather into cells before a porous growing enclosure.|ot
Pruned Geometry|branch~intersect~torus.split@body+torus.circulate@cross|orbit|An orbital ring prunes a branching network into discrete regions.|ob
Suspended Grove|branch.circulate@ceiling+spiral.grow@left+cone.fold@right|hold|A suspended grove passes energy between coil and cone.|tmb
Branch Observatory|branch.ripple@vault+tesseract.twist@core+rosette.invert@floor|interior|A branching enclosure frames nested edge geometry above a petaled floor.|mbt`,
cell:`
Cellular Chorus|cell.ripple@body+knot.circulate@core|orbit|A cluster of cells resonates around a central filament.|bm
Mitotic Crossing|cell.split@left+cell.grow@right+weft.twist@rear|rise|Two cellular clusters part and grow before a woven dividing plane.|otm
Cellular Habitat|cell.fold@vault+shell.ripple.pores@core+wave.still@floor|interior|An enlarged cellular habitat holds a porous nucleus above waves.|tmb
Cellular Weave|cell~weave~helix.twist@body+helix.circulate@cross|detail|Helical weaving connects distinct cellular compartments.|mb
Cells to Branches|cell~blend~branch.grow@body+iris.collapse@rear|orbit|Cells reorganize into branching paths before a contracting aperture.|to
Pored Colony|cell~intersect~cone.ripple@body+cone.split@front|passage|Conical cuts expose the hollow organization of a cellular colony.|bo
Clustered Planets|cell.circulate@left+superquadric.invert@right+spiral.grow@rear|hold|A cellular cluster orbits angular volumes and an unfolding coil.|mtb
Porous Nests|cell.collapse.pores@vault+rosette.fold@core+braid.twist@rim|interior|A perforated nest of cells wraps a rosette and peripheral braid.|tmb`,
spiral:`
Coil of Light|spiral.grow@body+iris.ripple@core|orbit|An unfurling coil opens around a responsive aperture.|tb
Opposed Unfurling|spiral.split@left+scroll.invert@right+helix.twist@rear|rise|A separating coil opposes an inverted scroll near a helical spine.|omb
Coiled Vestibule|spiral.fold@vault+arch.ripple@rear+strata.still@floor|interior|A vast coiled vestibule encloses an arch above stratified ground.|tmb
Woven Whorl|spiral~weave~ribbon.twist@body+ribbon.split.open@front|detail|A woven whorl travels through a parting ribbon at the foreground.|mo
Spiral Blossom|spiral~blend~rosette.grow@body+lens.collapse@floor|orbit|An ascending coil gradually becomes a petaled blossom over a lens.|tb
Interrupted Unwinding|spiral~intersect~shell.ripple@body+shell.invert.open@core|passage|An open shell cuts a winding corridor through the coil.|bm
Spiral Constellation|spiral.circulate@left+cell.grow@right+crystal.twist@rear|hold|A coil turns between growing cells and a crystalline far wall.|mtb
Coil and Collapse|spiral.collapse@vault+vortex.fold@core+wavefront.ripple@floor|rise|A collapsing spiral catches a whirl above spreading wave rings.|omb`,
cone:`
Prismatic Funnel|cone.twist@body+rosette.ripple@core|orbit|A funnel twists around a petaled throat.|bm
Funnel Exchange|cone.split@left+hourglass.invert@right+knot.circulate@rear|rise|A separating funnel meets an inverted waist and circling filament.|omb
Conical Theater|cone.fold.open@vault+iris.ripple@core+strata.still@floor|interior|An open conical theater directs attention to a responsive aperture.|tmb
Funnel Fabric|cone~weave~weft.twist@body+weft.ripple@cross|detail|Woven strands travel between a funnel and a transverse sheet.|mb
Cone to Vortex|cone~blend~vortex.collapse@body+lens.grow@floor|passage|The funnel narrows into a whirl above a spreading lens.|ot
Slit Funnel|cone~intersect~arch.split@body+arch.circulate@cross|orbit|Crossing arches open cuts through a separating conical surface.|ob
Funnel Choir|cone.ripple.bands@left+shell.grow@right+helix.twist@rear|hold|A striped funnel answers a growing sphere beside a coiled spine.|bmt
Conical Weather|cone.collapse@vault+wave.fold@floor+coral.grow@core|rise|A conical enclosure collapses above waves and upward coral growth.|omt`,
saddle:`
Hyperbolic Sail|saddle.fold@body+torus.ripple@cross|orbit|A saddle folds through an orbital crossing.|mb
Opposing Curvatures|saddle.split@left+wave.invert@right+iris.circulate@rear|rise|Opposite curvatures exchange impulses before a rotating aperture.|omb
Saddle Chamber|saddle.twist.pores@vault+strata.ripple@floor+arch.still@rear|interior|A porous saddle encloses terraces and a distant arch.|tmb
Woven Curvature|saddle~weave~weft.fold@body+braid.twist@rim|detail|Textile strands follow hyperbolic curvature beside a turning braid.|mb
Saddle Blossom|saddle~blend~rosette.invert@body+lens.grow@core|orbit|A saddle everts toward petals surrounding an expanding lens.|tb
Curvature Cut|saddle~intersect~cone.ripple@body+cone.split@cross|passage|A conical cut opens a traveling corridor through the saddle.|bo
Two Saddles|saddle.circulate.bands@floor+saddle.fold.open@ceiling+spiral.grow@core|hold|Two differently opened saddles bound an unfolding spiral.|mto
Saddle Nursery|saddle.collapse@rear+branch.grow@core+cell.split@front|rise|A collapsing saddle shelters branches and separating cellular compartments.|tbo`,
catenoid:`
Throat of Color|catenoid.ripple@body+iris.twist@core|orbit|A luminous waist resonates around a turning aperture.|bm
Two Throats|catenoid.split@left+hourglass.invert@right+weft.fold@rear|rise|Distinct narrow waists part before a textile membrane.|omb
The Hollow Tower|catenoid.fold@vault+helix.circulate@core+strata.still@floor|interior|A hollow tower holds a circulating coil above layered ground.|tmb
Woven Waist|catenoid~weave~braid.twist@body+braid.ripple@cross|detail|A braided waist is crossed by a separate resonating filament.|mb
Throat to Chamber|catenoid~blend~shell.grow@body+rosette.collapse@core|passage|A narrow throat opens toward a chamber around contracting petals.|to
Cut Catenoid|catenoid~intersect~torus.split@body+torus.circulate@cross|orbit|An orbital crossing makes open incisions in a parting tower.|ob
Throat Choir|catenoid.collapse.bands@left+cone.fold@right+knot.circulate@rear|hold|A striped throat responds across a funnel and far filament.|bmt
Interior Resonator|catenoid.twist.pores@vault+wavefront.ripple@floor+crystal.grow@core|interior|A perforated resonator exposes a crystal above radial waves.|mbt`,
mobius:`
One-Sided Promise|mobius.twist@body+lens.ripple@core|orbit|A one-sided strip twists around a shallow responsive lens.|bm
Twisted Dialogue|mobius.split.open@left+ribbon.fold@right+iris.circulate@rear|rise|A torn one-sided strip meets a folded sail before an aperture.|omb
No Inside Room|mobius.fold@vault+shell.ripple.open@core+strata.still@floor|interior|A surrounding one-sided strip exposes a shell and floor through its fold.|tmb
Mobius Textile|mobius~weave~weft.twist@body+braid.split@rim|detail|Interlaced textile strands trace a one-sided loop.|mo
Strip into Knot|mobius~blend~knot.circulate@body+rosette.grow@floor|orbit|A one-sided strip gathers into a circulating knot over a blossom.|tb
One-Sided Window|mobius~intersect~cone.ripple@body+cone.invert@cross|passage|A conical crossing exposes a one-sided window in the loop.|bm
Two Impossible Loops|mobius.collapse@left+klein.invert@right+helix.twist@rear|hold|Two unlike looping surfaces share a coiled horizon.|otm
Twisted Sanctuary|mobius.grow.pores@vault+cell.split@core+spiral.circulate@rim|interior|A porous one-sided enclosure contains cells and an orbiting coil.|tom`,
klein:`
Bottle Without Walls|klein.invert@body+iris.ripple@core|orbit|A self-crossing bottle everts around a ruffled inner opening.|tb
Bottle Dialogue|klein.split@left+mobius.twist@right+lens.circulate@rear|rise|A bottle and one-sided strip part over a rotating lens.|omb
Self-Crossing Room|klein.fold.open@vault+shell.ripple.pores@core+arch.still@floor|interior|An open self-crossing enclosure reveals a porous shell and arch.|tmb
Bottle Weaving|klein~weave~helix.twist@body+helix.ripple@cross|detail|Helical fabric follows a bottle’s self-crossing surface.|mb
Bottle into Scroll|klein~blend~scroll.grow@body+rosette.invert@core|orbit|A self-crossing surface unrolls around an everting blossom.|tm
Intersecting Bottles|klein~intersect~catenoid.ripple@body+catenoid.split@cross|passage|A narrow waist opens a passage through self-crossing walls.|bo
Bottle Constellation|klein.circulate@left+cell.grow@right+crystal.twist@rear|hold|A bottle circulates among cells and a crystalline horizon.|mtb
The Bottle Breathes|klein.collapse.pores@vault+vortex.fold@core+wavefront.ripple@floor|interior|A perforated bottle breathes over a whirl and traveling annular waves.|tmb`,
superquadric:`
Rounded Citadel|superquadric.ripple@body+knot.circulate@core|orbit|A rounded angular citadel contains a circulating filament.|bm
Split Citadels|superquadric.split.open@left+crystal.grow@right+weft.fold@rear|rise|An open citadel confronts a growing crystal across a woven wall.|otm
Soft Geometry Room|superquadric.fold.pores@vault+shell.ripple@core+strata.still@floor|interior|Porous angular walls surround a spherical core above strata.|tmb
Angular Textile|superquadric~weave~ribbon.twist@body+ribbon.split@cross|detail|Woven sails articulate a rounded angular volume.|mo
Citadel Eversion|superquadric~blend~lens.invert@body+rosette.grow@floor|orbit|An angular volume flattens into a lens above petaled growth.|tb
Citadel Gate|superquadric~intersect~arch.ripple@body+arch.split@front|passage|An arch cuts a gate through the citadel’s rounded walls.|bo
Angular Choir|superquadric.circulate.bands@left+cell.grow@right+helix.twist@rear|hold|Striped angular masses answer growing cells beside a coiled spine.|mtb
The Citadel Opens|superquadric.collapse.open@vault+tesseract.fold@core+spiral.grow@rim|interior|An open collapsing citadel reveals edge geometry and a peripheral coil.|otm`,
rosette:`
Spectral Bloom|rosette.grow@body+iris.ripple@core|orbit|A petaled surface unfurls around a resonating aperture.|tb
Petal Dialogue|rosette.split@left+rosette.invert.petals@right+helix.twist@rear|rise|An intact blossom answers inverted separate petals beside a coil.|omb
Petaled Sanctuary|rosette.fold@vault+shell.ripple.pores@core+strata.still@floor|interior|A folded petaled roof encloses a porous nucleus over stratified ground.|tmb
Petal Fabric|rosette~weave~weft.twist@body+braid.circulate@rim|detail|Textile strands travel across petals and into a peripheral braid.|mb
Bloom into Coral|rosette~blend~coral.grow@body+lens.collapse@floor|orbit|A radial blossom rises toward coral above a contracting lens.|to
Petal Aperture|rosette~intersect~cone.ripple@body+cone.split@cross|passage|A funnel opens cuts into the petaled surface.|bo
Blossom Weather|rosette.collapse.bands@ceiling+wave.fold@floor+spiral.circulate@core|hold|A striped collapsing blossom hangs over waves and an inner coil.|tmb
Petaled Nursery|rosette.ripple@rear+cell.split@front+branch.grow@core|rise|A resonating blossom shelters separating cells and branching growth.|bot`,
lattice:`
Crystal Scaffold|lattice.ripple@body+shell.grow.pores@core|orbit|A resonating scaffold holds a perforated spherical core.|bt
Scaffold Exchange|lattice.split@left+tesseract.twist@right+lens.circulate@rear|rise|An orthogonal scaffold parts beside nested turning edges.|omb
Grid Cathedral|lattice.fold@vault+arch.ripple@rear+strata.still@floor|interior|A folded scaffold becomes a room above an arched horizon.|tmb
Woven Scaffold|lattice~weave~braid.twist@body+braid.ripple@cross|detail|A braid interlaces the scaffold and its crossing filament.|mb
Scaffold into Forest|lattice~blend~branch.grow@body+rosette.invert@floor|orbit|Orthogonal lines soften into branching growth over inverted petals.|tm
Scaffold Window|lattice~intersect~torus.ripple@body+torus.split@front|passage|Orbital cuts open a window through orthogonal lines.|bo
Layered Scaffolds|lattice.collapse@rear+reaction.ripple@front+helix.twist@core|hold|A collapsing scaffold meets patterned interference around an axial coil.|omb
Nested Scaffolding|lattice.circulate@vault+superquadric.grow@core+spiral.fold@nest|interior|A surrounding scaffold rotates around an angular core and folded coil.|tmb`,
vortex:`
Spectral Maelstrom|vortex.circulate@body+iris.ripple@core|orbit|A circulating whirl runs through a responsive annular throat.|bm
Two Whirls|vortex.split@left+cone.invert@right+knot.twist@rear|rise|A split whirl faces an inverted funnel and distant knot.|omb
Whirl Chamber|vortex.fold@vault+wavefront.ripple@floor+shell.grow.pores@core|interior|A whirl becomes a chamber around a growing shell above waves.|tmb
Vortex Textile|vortex~weave~ribbon.twist@body+ribbon.split@cross|detail|Woven sails trace the whirl’s circulating curvature.|mo
Whirl into Waist|vortex~blend~hourglass.collapse@body+rosette.grow@floor|passage|A whirl narrows toward an hourglass above a growing blossom.|ot
Broken Circulation|vortex~intersect~arch.ripple@body+arch.split@front|orbit|An arch breaks the whirl’s circulation into visible spatial gaps.|bo
Vortex Weather|vortex.collapse.bands@ceiling+wave.fold@floor+coral.grow@core|hold|A striped whirl collapses into waves and coral growth.|omt
Coiled Observatory|vortex.grow.pores@vault+torus.twist@core+crystal.ripple@nest|interior|A perforated whirl surrounds a turning orbit and crystalline resonator.|tmb`,
strata:`
Layered Aurora|strata.fold@body+spiral.circulate@core|rise|Separate shelves fold around a circulating coil.|tm
Terrace Exchange|strata.split@left+wave.invert@right+iris.twist@rear|orbit|Stratified shelves and an inverted wavefield exchange impulses.|omb
Terraced Chamber|strata.ripple@vault+arch.fold@rear+cell.grow@core|interior|Resonating terraces form a room around cells and an arch.|bmt
Terrace Textile|strata~weave~weft.twist@body+braid.ripple@cross|detail|Woven currents cross shelves at distinct heights.|mb
Strata into Scrolls|strata~blend~scroll.grow@body+lens.collapse@floor|passage|Shelves unroll toward scrolls above a contracting lens.|to
Terraced Gate|strata~intersect~cone.ripple@body+cone.split@core|rise|A separating cone opens an axial gate through the terraces.|bo
Two Horizons|strata.collapse.bands@rear+saddle.fold@front+helix.circulate@left|hold|Layered horizons exchange movement through a saddle and side coil.|otm
Terraced Nursery|strata.circulate@vault+branch.grow@floor+rosette.invert@core|interior|A revolving terraced enclosure frames roots and inverted petals.|tmb`,
iris:`
Luminous Aperture|iris.ripple@body+shell.grow@core|orbit|A ruffled aperture frames a growing spherical core.|bt
Paired Openings|iris.split@left+torus.twist@right+weft.fold@rear|rise|A separating aperture and turning orbit expose a woven background.|omb
Iris Chamber|iris.fold@vault+cone.ripple@core+strata.still@floor|interior|A ruffled enclosure directs attention through a conical throat.|tmb
Woven Opening|iris~weave~braid.twist@body+braid.circulate@rim|detail|Braids interlace a ruffled aperture and its outer edge.|mb
Aperture Blossom|iris~blend~rosette.grow@body+lens.invert@floor|orbit|An aperture opens into petals above an inverted shallow lens.|tm
Interrupted Iris|iris~intersect~arch.ripple@body+arch.split@cross|passage|An arch cuts spatial interruptions into a ruffled opening.|bo
Ringed Weather|iris.collapse.bands@ceiling+wavefront.ripple@floor+vortex.fold@core|hold|A striped aperture collapses over annular waves and a central whirl.|obm
Through the Iris|iris.circulate@vault+crystal.grow@core+helix.twist@rear|interior|A surrounding aperture rotates around crystal growth and a far coil.|tmb`,
coral:`
Coral of Light|coral.grow@body+wave.ripple@floor|rise|Curving branches grow above rippling ground.|tb
Coral Dialogue|coral.split@left+branch.twist@right+lens.circulate@rear|orbit|Parting coral faces a twisting tree across a shallow lens.|omb
Coral Grotto|coral.fold@vault+shell.ripple.pores@core+strata.still@floor|interior|Curving overhead branches enclose a porous nucleus and terraces.|tmb
Coral Weaving|coral~weave~helix.twist@body+helix.ripple@cross|detail|Helical filaments interlace curving coral branches.|mb
Coral Colony|coral~blend~cell.grow@body+rosette.collapse@floor|orbit|Branch tips gather into cells above contracting petals.|to
Coral Portal|coral~intersect~torus.split@body+torus.circulate@front|passage|Orbital intersections open a portal through a coral grove.|ob
Suspended Reef|coral.circulate@ceiling+spiral.grow@left+cone.fold@right|hold|A revolving suspended reef exchanges motion with coil and funnel.|tmb
Coral Observatory|coral.ripple@vault+tesseract.twist@core+iris.invert@floor|interior|A resonating reef surrounds nested edges above an inverted aperture.|mbt`,
lens:`
Suspended Lens|lens.ripple@body+knot.circulate@rim|orbit|A thin luminous lens is held by a peripheral circulating filament.|bm
Lens Exchange|lens.split@left+lens.invert@right+helix.twist@rear|rise|Two lenses part and invert beside a helical far axis.|omb
Lenticular Room|lens.fold@vault+shell.ripple.pores@core+strata.still@floor|interior|A folded shallow enclosure exposes a porous core and layered floor.|tmb
Lenticular Textile|lens~weave~weft.twist@body+braid.split@cross|detail|Interlaced textile marks span a lens and separating braid.|mo
Lens into Shell|lens~blend~shell.grow@body+rosette.invert@floor|orbit|A shallow lens inflates into a shell above inverted petals.|tm
Cut Lens|lens~intersect~cone.ripple@body+cone.split@front|passage|A conical intersection cuts an axial opening through the lens.|bo
Lenticular Constellation|lens.circulate@left+cell.grow@right+crystal.twist@rear|hold|A lens circulates across cells and a turning crystalline horizon.|mtb
Lens Observatory|lens.collapse.pores@vault+iris.fold@core+spiral.grow@nest|interior|A porous contracting lens reveals an aperture and unfolded coil.|otm`,
hourglass:`
Spectral Waist|hourglass.ripple@body+iris.twist@core|orbit|A narrowing volume resonates around a turning aperture.|bm
Waisted Dialogue|hourglass.split@left+catenoid.invert@right+knot.circulate@rear|rise|Two unlike waisted constructions separate over a filament horizon.|omb
Hourglass Room|hourglass.fold.open@vault+helix.ripple@core+strata.still@floor|interior|An open waisted room encloses a helical resonator above terraces.|tmb
Waisted Textile|hourglass~weave~braid.twist@body+braid.ripple@cross|detail|Braids articulate a narrow waist and its transverse filament.|mb
Waist into Whirl|hourglass~blend~vortex.collapse@body+rosette.grow@floor|passage|A waisted chamber tightens into a whirl above a petaled floor.|ot
Waisted Gate|hourglass~intersect~torus.ripple@body+torus.split@front|orbit|Orbital cuts expose an opening through the constricted volume.|bo
Hourglass Weather|hourglass.collapse.bands@ceiling+wave.fold@floor+coral.grow@core|hold|A striped waisted canopy collapses toward waves and curving growth.|omt
Waist Observatory|hourglass.circulate.pores@vault+crystal.grow@core+spiral.twist@nest|interior|A perforated revolving waist surrounds a crystal and turning coil.|tmb`,
tesseract:`
Nested Edges|tesseract.twist@body+shell.ripple.pores@core|orbit|Nested edge cages turn around a porous resonating sphere.|mb
Edge Exchange|tesseract.split@left+lattice.circulate@right+lens.invert@rear|rise|Nested edges separate beside an orthogonal scaffold and shallow lens.|omb
Edge Cathedral|tesseract.fold@vault+iris.ripple@core+strata.still@floor|interior|A folded edge cage defines an open room around an aperture.|tmb
Edge Weaving|tesseract~weave~braid.twist@body+braid.split@cross|detail|Braided strands interlace nested edge geometry.|mo
Edges into Roots|tesseract~blend~branch.grow@body+rosette.invert@floor|orbit|Nested edges reorganize as roots above inverted petals.|tm
Edge Window|tesseract~intersect~cone.ripple@body+cone.split@front|passage|Conical intersections open corridors between nested cages.|bo
Scaffold Constellation|tesseract.circulate@left+superquadric.grow@right+helix.twist@rear|hold|An edge cage orbits angular growth and a distant coiled spine.|mtb
Within the Cage|tesseract.collapse@vault+crystal.ripple@core+spiral.fold@rim|interior|A contracting edge cage reveals crystal resonance and a folded peripheral coil.|obm`,
crystal:`
Prismatic Spire|crystal.grow@body+iris.ripple@core|rise|A faceted spire grows around a ruffled aperture.|tb
Crystal Dialogue|crystal.split@left+superquadric.twist@right+lens.circulate@rear|orbit|A parting spire answers a rounded angular volume above a lens.|omb
Crystal Chamber|crystal.fold.pores@vault+shell.ripple@core+strata.still@floor|interior|A perforated faceted enclosure frames a core and stratified ground.|tmb
Crystal Textile|crystal~weave~ribbon.twist@body+ribbon.split@cross|detail|Textile membranes interlace a faceted crystalline body.|mo
Crystal into Coral|crystal~blend~coral.grow@body+rosette.invert@floor|orbit|A spire opens into curving branches over inverted petals.|tm
Crystal Gate|crystal~intersect~arch.ripple@body+arch.split@front|passage|An arch cuts a wide gateway through a resonating crystal.|bo
Crystalline Choir|crystal.circulate.bands@left+cell.grow@right+helix.twist@rear|hold|A striped spire answers cells near a turning helical axis.|mtb
Inside the Spire|crystal.collapse.open@vault+tesseract.fold@core+spiral.grow@rim|interior|An open collapsing crystal reveals nested edges and a growing coil.|otm`,
scroll:`
Rolled Horizon|scroll.fold@body+iris.ripple@core|orbit|A rolled membrane folds around a resonating aperture.|mb
Opposite Scrolls|scroll.split.open@left+scroll.invert@right+helix.twist@rear|rise|Oppositely opened scrolls part beside a helical spine.|omb
Scroll Chamber|scroll.twist@vault+arch.ripple@rear+strata.still@floor|interior|A rolled chamber wraps an arched far wall above terraces.|tmb
Scroll Weaving|scroll~weave~weft.fold@body+braid.circulate@rim|detail|Interlaced textiles run along the scroll and its braided rim.|mb
Scroll to Sail|scroll~blend~ribbon.grow@body+rosette.invert@floor|orbit|A rolled membrane opens into a sail over inverted petals.|tm
Scroll Window|scroll~intersect~cone.ripple@body+cone.split@front|passage|Conical incisions open a window through the rolled membrane.|bo
Scroll Weather|scroll.collapse.bands@ceiling+wave.fold@floor+spiral.circulate@core|hold|A striped rolled roof collapses over waves and a rotating coil.|otm
Rolled Observatory|scroll.grow.pores@vault+crystal.ripple@core+iris.twist@nest|interior|A perforated scroll surrounds a crystal and turning inner aperture.|tmb`,
wavefront:`
Rings of Arrival|wavefront.ripple@body+cone.twist@core|orbit|Traveling radial waves enter a turning funnel.|bm
Opposed Fronts|wavefront.split@left+wave.invert@right+iris.circulate@rear|rise|Radial and sheetlike waves exchange impulses at opposite sides.|omb
Resonance Chamber|wavefront.fold@vault+shell.ripple.pores@core+strata.still@floor|interior|Radial waves form an enclosing chamber around a porous sphere.|tmb
Woven Front|wavefront~weave~weft.twist@body+braid.ripple@cross|detail|Woven strands cross the traveling radial fronts.|mb
Wave Blossom|wavefront~blend~rosette.grow@body+lens.collapse@floor|orbit|Radial fronts open into petals over a contracting lens.|to
Wavefront Window|wavefront~intersect~arch.ripple@body+arch.split@front|passage|An arch opens a passage through traveling concentric fronts.|bo
Ringed Constellation|wavefront.circulate@left+cell.grow@right+crystal.twist@rear|hold|Radial waves turn among cells and a distant crystalline spire.|mtb
Inside the Front|wavefront.collapse.bands@vault+vortex.fold@core+helix.twist@rear|interior|A striped annular enclosure collapses around a whirl and far coil.|omb`,
braid:`
Three-Strand Current|braid.circulate@body+iris.ripple@cross|rise|Three strands circulate through a transverse ruffled aperture.|mb
Braided Dialogue|braid.split@left+helix.twist@right+lens.invert@rear|orbit|A separating braid answers a coil before an inverted lens.|omb
Braided Hall|braid.fold@vault+arch.ripple@rear+strata.still@floor|interior|A large braided enclosure forms a hall around an arch.|tmb
Braid upon Braid|braid~weave~knot.twist@body+knot.circulate@rim|detail|Knotted weaving interlaces the braid and its outer filament.|mb
Braid into Roots|braid~blend~branch.grow@body+rosette.invert@floor|rise|Interlaced strands open into roots above inverted petals.|tm
Braided Gate|braid~intersect~torus.ripple@body+torus.split@cross|passage|An orbital crossing creates open cuts in a braid.|bo
Braided Weather|braid.collapse@ceiling+wave.fold@floor+coral.grow@core|hold|A braid collapses between overhead fabric and curving growth.|omt
Braided Observatory|braid.grow@vault+shell.ripple.pores@core+spiral.twist@nest|interior|Enlarged interlaced strands enclose a porous sphere and inner coil.|tmb`,
arch:`
Spectral Gateway|arch.ripple@body+knot.circulate@core|orbit|A resonating arch opens around a circulating filament.|bm
Paired Portals|arch.split@left+arch.invert@right+weft.fold@rear|rise|Two differently oriented portals part before a textile wall.|omb
Arched Sanctuary|arch.fold@vault+shell.ripple.pores@core+strata.still@floor|interior|A vast arch shelters a porous sphere above terraces.|tmb
Woven Portal|arch~weave~ribbon.twist@body+ribbon.split@cross|detail|Textile strands cross a portal’s curved fabric.|mo
Arch into Orbit|arch~blend~torus.grow@body+rosette.invert@floor|orbit|An open arch closes toward an orbit above inverted petals.|tm
Portal Interruption|arch~intersect~cone.ripple@body+cone.split@front|passage|A conical crossing interrupts an arched portal with black gaps.|bo
Portal Constellation|arch.circulate@left+cell.grow@right+crystal.twist@rear|hold|An arch rotates among cells and a distant crystalline spire.|mtb
Beyond the Arch|arch.collapse.open@vault+vortex.fold@core+helix.twist@rear|interior|An open collapsing gateway reveals a whirl and helical far wall.|omb`,
reaction:`
Interference Quilt|reaction.ripple@body+iris.twist@core|orbit|A nonlinear interference quilt vibrates around an aperture.|bm
Reaction Dialogue|reaction.split@left+gyroid.fold@right+lens.invert@rear|rise|Two unlike patterned sheets exchange impulses above a lens.|omb
Patterned Room|reaction.fold.pores@vault+arch.ripple@rear+strata.still@floor|interior|A perforated interference canopy creates a room around an arch.|tmb
Reaction Weave|reaction~weave~weft.twist@body+braid.ripple@cross|detail|Woven strands interact with a nonlinear patterned surface.|mb
Pattern into Cells|reaction~blend~cell.grow@body+rosette.collapse@floor|orbit|Interference patches gather into cells above contracting petals.|to
Reaction Window|reaction~intersect~cone.ripple@body+cone.split@front|passage|A conical intersection opens cuts through the patterned quilt.|bo
Patterned Weather|reaction.collapse.bands@ceiling+wave.fold@floor+coral.grow@core|hold|A striped pattern collapses toward waves and branching growth.|omt
Inside the Pattern|reaction.circulate.open@vault+crystal.grow@core+spiral.twist@nest|interior|A revolving open pattern surrounds a crystal and turning coil.|tmb`,
weft:`
Woven Light|weft.fold@body+knot.circulate@rim|orbit|Separate textile filaments fold beside a peripheral knot.|mb
Warp and Weft|weft.split@left+weft.twist@cross+iris.ripple@rear|rise|Perpendicular textile systems part and twist before an aperture.|omb
Textile Chamber|weft.fold@vault+arch.ripple@rear+strata.still@floor|interior|A folded overhead textile opens a room over layered ground.|tmb
Double Weaving|weft~weave~braid.twist@body+braid.ripple@cross|detail|A braid interlaces the textile’s filaments and its crossing plane.|mb
Textile into Sail|weft~blend~ribbon.grow@body+rosette.invert@floor|orbit|Separate textile strands gather into a sail above inverted petals.|tm
Textile Window|weft~intersect~torus.ripple@body+torus.split@front|passage|An orbital intersection exposes open spatial cuts in a textile.|bo
Fabric Weather|weft.collapse.bands@ceiling+wave.fold@floor+spiral.circulate@core|hold|A striped textile roof collapses over waves and an inner coil.|otm
Woven Observatory|weft.circulate@vault+shell.ripple.pores@core+crystal.grow@nest|interior|A revolving textile enclosure surrounds a porous sphere and crystal.|tmb`
};
const roles={
 body:{},core:{scale:[.52,.52,.52]},nest:{scale:[.27,.27,.27]},vault:{scale:[2.3,2.3,2.3]},rim:{scale:[1.3,1.3,1.3]},
 left:{offset:[-.85,0,0],scale:[.66,.66,.66]},right:{offset:[.85,.15,0],scale:[.7,.7,.7]},front:{offset:[0,-.1,1.1],scale:[.64,.64,.64]},rear:{offset:[0,.15,-1.25],scale:[.86,.86,.86]},
 floor:{offset:[0,-.85,0],scale:[1.2,.6,1.2]},ceiling:{offset:[0,.9,0],scale:[1.15,.6,1.15]},cross:{rotate:[Math.PI/2,0,.3],scale:[.83,.83,.83]}
};
const signals={b:'bass',m:'mid',t:'trend',o:'onset',h:'treble'};
export const PRESETS=Object.entries(authored).flatMap(([family,block])=>block.trim().split('\n').map((row,index)=>{
 const [name,graph,camera,description,route]=row.split('|');
 const layers=graph.split('+').map((token,i)=>{const [shape,role='body']=token.split('@'),[construction,effect='still',cut='none']=shape.split('.'),[op,relation='independent',partner=op]=construction.split('~');if(!roles[role])throw Error('Unknown authored placement');return layer(op,{...roles[role],effect,cut,relation,partner,audio:signals[route[i%route.length]],phase:i*.91,hue:i*.19});});
 const audioBehavior=layers.map(l=>`${l.audio} drive ${l.effect} in the ${l.op}`).join('; ')+'.';
 return validateScene(scene(family+'-'+String(index+1).padStart(2,'0'),name,family,layers,{camera,description,audioBehavior,distinction:description+' Structural recipe: '+graph+'.',budget:layers.length>2?10500:8500}));
}));
export const COVERAGE=PRESETS.map(p=>({id:p.id,name:p.name,family:p.family,operators:p.layers.map(l=>l.op),relationships:p.layers.map(l=>l.relation),behaviors:p.layers.map(l=>l.effect),organization:p.camera==='interior'?'interior':p.layers.some(l=>l.offset[0]!==0)?'interacting cluster':'layered formation',scale:p.camera==='detail'?'intimate':p.camera==='interior'?'chamber':p.camera==='passage'?'journey':'exterior',camera:p.camera,audio:p.layers.map(l=>l.audio),description:p.description,distinction:p.distinction,budget:p.budget}));
