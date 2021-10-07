import csv
import preUploads


def morphemeParser(file, content, content_literal, prereqs, prereq_literal):
    try:
        prereqs_glyph_string = ""
        prereq_literal_len = len(prereq_literal)

        for prereq_index in range(0, prereq_literal_len):
            grampheme = prereqs[prereq_index].replace(" ", "")
            glyph = grampheme.replace(
                "http://www.ontologyrepository.com/CommonCoreOntologies/", "")
            glyph = glyph.replace("-ICE", "")
            glyph_string = f'cco:Glyph_{glyph}'

            if prereq_literal_len > prereq_index + 1:
                prereqs_glyph_string += f'{glyph_string}, '
            else:
                prereqs_glyph_string += f'{glyph_string}'

        triple = f"""
<{content}> rdf:type owl:NamedIndividual , cco:Morpheme;
	mro:is_a_nominal_measurement_of cco:Glyph_Morpheme_{content_literal} .

cco:Glyph_Morpheme_{content_literal} rdf:type owl:NamedIndividual , cco:Glyph;
	mro:is_measured_by_nominal  <{content}> ;
	mro:has_part {prereqs_glyph_string};
	mro:has_text_value "{content_literal}" .
		"""
        file.write(triple)
    except:
        print(prereq_literal)
        print(content_literal)


def diagraphParser(file, content, content_literal, prereqs, prereq_literal):
    try:
        prereqs_glyph_string = ""
        prereq_literal_len = len(prereq_literal)
        diagraphGlyph = content.replace(
            "http://www.ontologyrepository.com/CommonCoreOntologies/", "")
        diagraphGlyph = diagraphGlyph.replace("-ICE", "")
        diagraphGlyph = f'cco:Glyph_{diagraphGlyph}'

        for prereq_index in range(0, prereq_literal_len):
            grampheme = prereqs[prereq_index].replace(" ", "")
            glyph = grampheme.replace(
                "http://www.ontologyrepository.com/CommonCoreOntologies/", "")
            glyph = glyph.replace("-ICE", "")
            glyph_string = f'cco:Glyph_{glyph}'

            if prereq_literal_len > prereq_index + 1:
                prereqs_glyph_string += f'{glyph_string}, '
            else:
                prereqs_glyph_string += f'{glyph_string}'
        if(prereqs != ['N/A']):
            triple = f"""
<{content}> rdf:type owl:NamedIndividual , cco:Diagraph;
	mro:is_a_nominal_measurement_of {diagraphGlyph} .

{diagraphGlyph} rdf:type owl:NamedIndividual , cco:Glyph;
	mro:is_measured_by_nominal  <{content}> ;
	mro:has_part {prereqs_glyph_string};
	mro:has_text_value "{content_literal}" .
			"""
        else:
            triple = f"""
<{content}> rdf:type owl:NamedIndividual , cco:Diagraph;
	mro:is_a_nominal_measurement_of {diagraphGlyph} .

{diagraphGlyph} rdf:type owl:NamedIndividual , cco:Glyph;
	mro:is_measured_by_nominal  <{content}> ;
	mro:has_text_value "{content_literal}" .
			"""
        file.write(triple)
    except:
        print(prereq_literal)
        print(content_literal)


def graphemeParser(file, content, content_literal, prereqs, prereq_literal):
    glyph = content.replace(
        "http://www.ontologyrepository.com/CommonCoreOntologies/", "")
    glyph = glyph.replace("-ICE", "")
    prereq_triples = f"""
<{content}> rdf:type owl:NamedIndividual , cco:Grapheme;
	mro:is_a_nominal_measurement_of cco:Glyph_{glyph} .

cco:Glyph_{glyph} rdf:type owl:NamedIndividual , cco:Glyph;
	mro:is_measured_by_nominal  <{content}> ;
	mro:has_text_value "{content_literal}" .
	"""
    file.write(prereq_triples)


def trigraphParser(file, content, content_literal, prereqs, prereq_literal):
    try:
        prereqs_glyph_string = ""
        prereq_literal_len = len(prereq_literal)
        trigraphGlyph = content.replace(
            "http://www.ontologyrepository.com/CommonCoreOntologies/", "")
        trigraphGlyphh = trigraphGlyphh.replace("-ICE", "")
        trigraphGlyphh = f'cco:Glyph_{trigraphGlyphh}'

        for prereq_index in range(0, prereq_literal_len):
            grampheme = prereqs[prereq_index].replace(" ", "")
            glyph = grampheme.replace(
                "http://www.ontologyrepository.com/CommonCoreOntologies/", "")
            glyph = glyph.replace("-ICE", "")
            glyph_string = f'cco:Glyph_{glyph}'

            if prereq_literal_len > prereq_index + 1:
                prereqs_glyph_string += f'{glyph_string}, '
            else:
                prereqs_glyph_string += f'{glyph_string}'
        if(prereqs != ['N/A']):
            triple = f"""
<{content}> rdf:type owl:NamedIndividual , cco:Trigraph;
	mro:is_a_nominal_measurement_of {trigraphGlyphh} .

{trigraphGlyphh} rdf:type owl:NamedIndividual , cco:Glyph;
	mro:is_measured_by_nominal  <{content}> ;
	mro:has_part {prereqs_glyph_string};
	mro:has_text_value "{content_literal}" .
			"""
        else:
            triple = f"""
<{content}> rdf:type owl:NamedIndividual , cco:Diagraph;
	mro:is_a_nominal_measurement_of {trigraphGlyphh} .

{trigraphGlyphh} rdf:type owl:NamedIndividual , cco:Glyph;
	mro:is_measured_by_nominal  <{content}> ;
	mro:has_text_value "{content_literal}" .
			"""
        file.write(triple)
    except:
        print(prereq_literal)
        print(content_literal)


def __main__():
    file = open("./output/StandardContent.ttl", "w")
    preUploads.defaultImports(file)

    with open('PrerequsiteModel.csv') as prereq_csv:
        csv_reader = csv.reader(prereq_csv, delimiter=',')
        for row in csv_reader:
            content = row[0]
            content_literal = row[1]
            content_type = row[2]
            prereqs = row[3].split(",")
            prereqs_literals = row[4].split(",")

            if (content_type == "Morpheme"):
                morphemeParser(file, content, content_literal,
                               prereqs, prereqs_literals)
            elif (content_type == "Grapheme"):
                graphemeParser(file, content, content_literal,
                               prereqs, prereqs_literals)
            elif (content_type == "Diagraph"):
                diagraphParser(file, content, content_literal,
                               prereqs, prereqs_literals)
            elif (content_type == "Trigraph"):
                trigraphParser(file, content, content_literal,
                               prereqs, prereqs_literals)
    file.close()


__main__()
