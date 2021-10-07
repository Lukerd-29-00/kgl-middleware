def defaultImports(file):
    file.write(f"""###  
@prefix : <http://www.ontologyrepository.com/CommonCoreOntologies/> .
@prefix cco: <http://www.ontologyrepository.com/CommonCoreOntologies/> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix mro: <http://www.ontologyrepository.com/CommonCoreOntologies/ModalRelationOntology/> .
@prefix xml: <http://www.w3.org/XML/1998/namespace> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@base <http://www.ontologyrepository.com/CommonCoreOntologies/Domain/EnglishPhonemesGraphemes> .

<http://www.ontologyrepository.com/CommonCoreOntologies/Domain/EnglishPhonemesGraphemes> rdf:type owl:Ontology ;
                                                                                        owl:versionIRI <http://www.ontologyrepository.com/CommonCoreOntologies/Domain/2021-08-11/EnglishPhonemesGraphemes> ;
                                                                                        owl:imports <http://www.ontologyrepository.com/CommonCoreOntologies/Domain/LinguisticsOntology> ;
                                                                                        rdfs:label "English Phonemes and Graphemes"@en ;
                                                                                        rdfs:comment "Instance level representation of 44 English language phonemes and exemplar graphemes."@en ;
                                                                                        owl:versionInfo "Depends on Linguistics Ontology v2021-08-11"@en .

#################################################################
#    Individuals
#################################################################

#http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1340
cco:IPAPhonemeDesignator1_N1340 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_b_ICE ;
                                mro:has_text_value "/b/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1351
cco:IPAPhonemeDesignator1_N1351 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_d_ICE ;
                                mro:has_text_value "/d/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1362
cco:IPAPhonemeDesignator1_N1362 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_f_ICE ;
                                mro:has_text_value "/f/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1373
cco:IPAPhonemeDesignator1_N1373 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_g_ICE ;
                                mro:has_text_value "/g/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1384
cco:IPAPhonemeDesignator1_N1384 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_h_ICE ;
                                mro:has_text_value "/h/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1395
cco:IPAPhonemeDesignator1_N1395 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_j_ICE ;
                                mro:has_text_value "/j/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1406
cco:IPAPhonemeDesignator1_N1406 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_k_ICE ;
                                mro:has_text_value "/k/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1417
cco:IPAPhonemeDesignator1_N1417 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_l_ICE ;
                                mro:has_text_value "/l/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1428
cco:IPAPhonemeDesignator1_N1428 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_m_ICE ;
                                mro:has_text_value "/m/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1439
cco:IPAPhonemeDesignator1_N1439 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_n_ICE ;
                                mro:has_text_value "/n/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1450
cco:IPAPhonemeDesignator1_N1450 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_p_ICE ;
                                mro:has_text_value "/p/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1461
cco:IPAPhonemeDesignator1_N1461 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_r_ICE ;
                                mro:has_text_value "/r/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1472
cco:IPAPhonemeDesignator1_N1472 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_s_ICE ;
                                mro:has_text_value "/s/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1483
cco:IPAPhonemeDesignator1_N1483 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_t_ICE ;
                                mro:has_text_value "/t/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1494
cco:IPAPhonemeDesignator1_N1494 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_v_ICE ;
                                mro:has_text_value "/v/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1505
cco:IPAPhonemeDesignator1_N1505 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_w_ICE ;
                                mro:has_text_value "/w/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1516
cco:IPAPhonemeDesignator1_N1516 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_y_ICE ;
                                mro:has_text_value "/y/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1527
cco:IPAPhonemeDesignator1_N1527 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_z_ICE ;
                                mro:has_text_value "/z/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1538
cco:IPAPhonemeDesignator1_N1538 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_th_not-voiced_ICE ;
                                mro:has_text_value "/th/(not voiced)" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1549
cco:IPAPhonemeDesignator1_N1549 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_th_voiced_ICE ;
                                mro:has_text_value "/th/(voiced)" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1560
cco:IPAPhonemeDesignator1_N1560 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_ng_ICE ;
                                mro:has_text_value "/ng/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1571
cco:IPAPhonemeDesignator1_N1571 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_sh_ICE ;
                                mro:has_text_value "/sh/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1582
cco:IPAPhonemeDesignator1_N1582 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_ch_ICE ;
                                mro:has_text_value "/ch/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1593
cco:IPAPhonemeDesignator1_N1593 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_zh_ICE ;
                                mro:has_text_value "/zh/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1604
cco:IPAPhonemeDesignator1_N1604 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_wh_with-breath_ICE ;
                                mro:has_text_value "/wh/(with breath)" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1615
cco:IPAPhonemeDesignator1_N1615 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_a_ICE ;
                                mro:has_text_value "/a/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1626
cco:IPAPhonemeDesignator1_N1626 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_e_ICE ;
                                mro:has_text_value "/e/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1637
cco:IPAPhonemeDesignator1_N1637 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_i_ICE ;
                                mro:has_text_value "/i/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1648
cco:IPAPhonemeDesignator1_N1648 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_o_ICE ;
                                mro:has_text_value "/o/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1659
cco:IPAPhonemeDesignator1_N1659 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_u_ICE ;
                                mro:has_text_value "/u/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1670
cco:IPAPhonemeDesignator1_N1670 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_ā_ICE ;
                                mro:has_text_value "/ā/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1681
cco:IPAPhonemeDesignator1_N1681 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_ē_ICE ;
                                mro:has_text_value "/ē/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1692
cco:IPAPhonemeDesignator1_N1692 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_ī_ICE ;
                                mro:has_text_value "/ī/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1703
cco:IPAPhonemeDesignator1_N1703 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_ō_ICE ;
                                mro:has_text_value "/ō/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1714
cco:IPAPhonemeDesignator1_N1714 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_ū_ICE ;
                                mro:has_text_value "/ū/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1725
cco:IPAPhonemeDesignator1_N1725 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_oo_ICE ;
                                mro:has_text_value "/oo/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1736
cco:IPAPhonemeDesignator1_N1736 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_ōō_ICE ;
                                mro:has_text_value "/ōō/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1747
cco:IPAPhonemeDesignator1_N1747 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_ow_ICE ;
                                mro:has_text_value "/ow/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1758
cco:IPAPhonemeDesignator1_N1758 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_oy_ICE ;
                                mro:has_text_value "/oy/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1769
cco:IPAPhonemeDesignator1_N1769 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_ar__ICE ;
                                mro:has_text_value "/a(r)/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1780
cco:IPAPhonemeDesignator1_N1780 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_ār__ICE ;
                                mro:has_text_value "/ā(r)/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1791
cco:IPAPhonemeDesignator1_N1791 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_ir__ICE ;
                                mro:has_text_value "/i(r)/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1802
cco:IPAPhonemeDesignator1_N1802 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_or__ICE ;
                                mro:has_text_value "/o(r)/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/IPAPhonemeDesignator1_N1813
cco:IPAPhonemeDesignator1_N1813 rdf:type owl:NamedIndividual ,
                                        cco:IPAPhonemeDesignator ;
                                mro:designates cco:Phoneme_ur__ICE ;
                                mro:has_text_value "/u(r)/" .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_a_Sound
cco:Phone_a_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_a_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_ar__Sound
cco:Phone_ar__Sound rdf:type owl:NamedIndividual ,
                                cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_ar__ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_b_Sound
cco:Phone_b_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_b_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_ch_Sound
cco:Phone_ch_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_ch_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_d_Sound
cco:Phone_d_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_d_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_e_Sound
cco:Phone_e_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_e_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_f_Sound
cco:Phone_f_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_f_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_g_Sound
cco:Phone_g_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_g_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_h_Sound
cco:Phone_h_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_h_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_i_Sound
cco:Phone_i_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_i_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_ir__Sound
cco:Phone_ir__Sound rdf:type owl:NamedIndividual ,
                                cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_ir__ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_j_Sound
cco:Phone_j_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_j_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_k_Sound
cco:Phone_k_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_k_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_l_Sound
cco:Phone_l_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_l_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_m_Sound
cco:Phone_m_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_m_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_n_Sound
cco:Phone_n_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_n_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_ng_Sound
cco:Phone_ng_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_ng_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_o_Sound
cco:Phone_o_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_o_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_oo_Sound
cco:Phone_oo_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_oo_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_or__Sound
cco:Phone_or__Sound rdf:type owl:NamedIndividual ,
                                cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_or__ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_ow_Sound
cco:Phone_ow_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_ow_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_oy_Sound
cco:Phone_oy_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_oy_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_p_Sound
cco:Phone_p_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_p_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_r_Sound
cco:Phone_r_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_r_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_s_Sound
cco:Phone_s_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_s_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_sh_Sound
cco:Phone_sh_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_sh_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_t_Sound
cco:Phone_t_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_t_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_th_not-voiced_Sound
cco:Phone_th_not-voiced_Sound rdf:type owl:NamedIndividual ,
                                        cco:Phone ;
                                mro:is_measured_by_nominal  cco:Phoneme_th_not-voiced_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_th_voiced_Sound
cco:Phone_th_voiced_Sound rdf:type owl:NamedIndividual ,
                                cco:Phone ;
                        mro:is_measured_by_nominal  cco:Phoneme_th_voiced_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_u_Sound
cco:Phone_u_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_u_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_ur__Sound
cco:Phone_ur__Sound rdf:type owl:NamedIndividual ,
                                cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_ur__ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_v_Sound
cco:Phone_v_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_v_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_w_Sound
cco:Phone_w_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_w_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_wh_with-breath_Sound
cco:Phone_wh_with-breath_Sound rdf:type owl:NamedIndividual ,
                                        cco:Phone ;
                                mro:is_measured_by_nominal  cco:Phoneme_wh_with-breath_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_y_Sound
cco:Phone_y_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_y_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_z_Sound
cco:Phone_z_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_z_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_zh_Sound
cco:Phone_zh_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_zh_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_ā_Sound
cco:Phone_ā_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_ā_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_ār__Sound
cco:Phone_ār__Sound rdf:type owl:NamedIndividual ,
                                cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_ār__ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_ē_Sound
cco:Phone_ē_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_ē_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_ī_Sound
cco:Phone_ī_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_ī_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_ō_Sound
cco:Phone_ō_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_ō_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_ōō_Sound
cco:Phone_ōō_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_ōō_ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phone_ū_Sound
cco:Phone_ū_Sound rdf:type owl:NamedIndividual ,
                        cco:Phone ;
                mro:is_measured_by_nominal  cco:Phoneme_ū_ICE .

# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_a_ICE
cco:Phoneme_a_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1615 ;
                mro:represented_by  cco:Phoneme_a_Grapheme-a-ICE ,
                                        cco:Phoneme_a_Grapheme-au-ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_ar__ICE
cco:Phoneme_ar__ICE rdf:type owl:NamedIndividual ,
                                cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1769 ;
                mro:represented_by  cco:Phoneme_ar__Grapheme-ar-ICE .

# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_b_ICE
cco:Phoneme_b_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1340 ;
                mro:represented_by  cco:Phoneme_b_Grapheme-b-ICE ,
                                        cco:Phoneme_b_Grapheme-bb-ICE .

# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_ch_ICE
cco:Phoneme_ch_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1582 ;
                mro:represented_by  cco:Phoneme_ch_Grapheme-ch-ICE ,
                                        cco:Phoneme_ch_Grapheme-tch-ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_d_ICE
cco:Phoneme_d_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1351 ;
                mro:represented_by  cco:Phoneme_d_Grapheme-d-ICE ,
                                        cco:Phoneme_d_Grapheme-dd-ICE ,
                                        cco:Phoneme_d_Grapheme-ed-ICE .

# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_e_ICE
cco:Phoneme_e_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1626 ;
                mro:represented_by  cco:Phoneme_e_Grapheme-e-ICE ,
                                        cco:Phoneme_e_Grapheme-ea-ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_f_ICE
cco:Phoneme_f_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1362 ;
                mro:represented_by  cco:Phoneme_f_Grapheme-f-ICE ,
                                        cco:Phoneme_f_Grapheme-ph-ICE .



# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_g_ICE
cco:Phoneme_g_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1373 ;
                mro:represented_by  cco:Phoneme_g_Grapheme-g-ICE ,
                                        cco:Phoneme_g_Grapheme-gg-ICE .

# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_h_ICE
cco:Phoneme_h_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1384 ;
                mro:represented_by  cco:Phoneme_h_Grapheme-h-ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_i_ICE
cco:Phoneme_i_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1637 ;
                mro:represented_by  cco:Phoneme_i_Grapheme-i-ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_ir__ICE
cco:Phoneme_ir__ICE rdf:type owl:NamedIndividual ,
                                cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1791 ;
                mro:represented_by  cco:Phoneme_ir__Grapheme-eer-ICE ,
                                        cco:Phoneme_ir__Grapheme-ere-ICE ,
                                        cco:Phoneme_ir__Grapheme-irr-ICE .

# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_j_ICE
cco:Phoneme_j_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1395 ;
                mro:represented_by  cco:Phoneme_j_Grapheme-dge-ICE ,
                                        cco:Phoneme_j_Grapheme-g-ICE ,
                                        cco:Phoneme_j_Grapheme-ge-ICE ,
                                        cco:Phoneme_j_Grapheme-j-ICE .

# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_k_ICE
cco:Phoneme_k_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1406 ;
                mro:represented_by  cco:Phoneme_k_Grapheme-c-ICE ,
                                        cco:Phoneme_k_Grapheme-cc-ICE ,
                                        cco:Phoneme_k_Grapheme-ch-ICE ,
                                        cco:Phoneme_k_Grapheme-ck-ICE ,
                                        cco:Phoneme_k_Grapheme-k-ICE ,
                                        cco:Phoneme_k_Grapheme-que-ICE .

# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_l_ICE
cco:Phoneme_l_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1417 ;
                mro:represented_by  cco:Phoneme_l_Grapheme-l-ICE ,
                                        cco:Phoneme_l_Grapheme-ll-ICE .

# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_m_ICE
cco:Phoneme_m_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1428 ;
                mro:represented_by  cco:Phoneme_m_Grapheme-m-ICE ,
                                        cco:Phoneme_m_Grapheme-mb-ICE ,
                                        cco:Phoneme_m_Grapheme-mm-ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_n_ICE
cco:Phoneme_n_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1439 ;
                mro:represented_by  cco:Phoneme_n_Grapheme-gn-ICE ,
                                        cco:Phoneme_n_Grapheme-kn-ICE ,
                                        cco:Phoneme_n_Grapheme-n-ICE ,
                                        cco:Phoneme_n_Grapheme-nn-ICE .

# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_ng_ICE
cco:Phoneme_ng_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1560 ;
                mro:represented_by  cco:Phoneme_ng_Grapheme-n-ICE ,
                                        cco:Phoneme_ng_Grapheme-ng-ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_o_ICE
cco:Phoneme_o_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1648 ;
                mro:represented_by  cco:Phoneme_o_Grapheme-a-ICE ,
                                        cco:Phoneme_o_Grapheme-au-ICE ,
                                        cco:Phoneme_o_Grapheme-aw-ICE ,
                                        cco:Phoneme_o_Grapheme-o-ICE ,
                                        cco:Phoneme_o_Grapheme-ough-ICE .

# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_oo_ICE
cco:Phoneme_oo_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1725 ;
                mro:represented_by  cco:Phoneme_oo_Grapheme-oo-ICE ,
                                        cco:Phoneme_oo_Grapheme-oul-ICE ,
                                        cco:Phoneme_oo_Grapheme-u-ICE .



# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_or__ICE
cco:Phoneme_or__ICE rdf:type owl:NamedIndividual ,
                                cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1802 ;
                mro:represented_by  cco:Phoneme_or__Grapheme-oor-ICE ,
                                        cco:Phoneme_or__Grapheme-or-ICE ,
                                        cco:Phoneme_or__Grapheme-ore-ICE .



# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_ow_ICE
cco:Phoneme_ow_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1747 ;
                mro:represented_by  cco:Phoneme_ow_Grapheme-oow-ICE ,
                                        cco:Phoneme_ow_Grapheme-ou-ICE ,
                                        cco:Phoneme_ow_Grapheme-ou_e-ICE .




# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_oy_ICE
cco:Phoneme_oy_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1758 ;
                mro:represented_by  cco:Phoneme_oy_Grapheme-oi-ICE ,
                                        cco:Phoneme_oy_Grapheme-oy-ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_p_ICE
cco:Phoneme_p_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1450 ;
                mro:represented_by  cco:Phoneme_p_Grapheme-p-ICE ,
                                        cco:Phoneme_p_Grapheme-pp-ICE .

# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_r_ICE
cco:Phoneme_r_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1461 ;
                mro:represented_by  cco:Phoneme_r_Grapheme-r-ICE ,
                                        cco:Phoneme_r_Grapheme-rr-ICE ,
                                        cco:Phoneme_r_Grapheme-wr-ICE .



# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_s_ICE
cco:Phoneme_s_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1472 ;
                mro:represented_by  cco:Phoneme_s_Grapheme-c-ICE ,
                                        cco:Phoneme_s_Grapheme-ce-ICE ,
                                        cco:Phoneme_s_Grapheme-s-ICE ,
                                        cco:Phoneme_s_Grapheme-sc-ICE ,
                                        cco:Phoneme_s_Grapheme-se-ICE ,
                                        cco:Phoneme_s_Grapheme-ss-ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_sh_ICE
cco:Phoneme_sh_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1571 ;
                mro:represented_by  cco:Phoneme_sh_Grapheme-ch-ICE ,
                                        cco:Phoneme_sh_Grapheme-ci-ICE ,
                                        cco:Phoneme_sh_Grapheme-sh-ICE ,
                                        cco:Phoneme_sh_Grapheme-ss-ICE ,
                                        cco:Phoneme_sh_Grapheme-ti-ICE .




# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_t_ICE
cco:Phoneme_t_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1483 ;
                mro:represented_by  cco:Phoneme_t_Grapheme-ed-ICE ,
                                        cco:Phoneme_t_Grapheme-t-ICE ,
                                        cco:Phoneme_t_Grapheme-tt-ICE .

# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_th_not-voiced_ICE
cco:Phoneme_th_not-voiced_ICE rdf:type owl:NamedIndividual ,
                                        cco:EnglishLanguagePhoneme ;
                                mro:designated_by cco:IPAPhonemeDesignator1_N1538 ;
                                mro:represented_by  cco:Phoneme_th_not-voiced_Grapheme-th-ICE .



# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_th_voiced_ICE
cco:Phoneme_th_voiced_ICE rdf:type owl:NamedIndividual ,
                                cco:EnglishLanguagePhoneme ;
                        mro:designated_by cco:IPAPhonemeDesignator1_N1549 ;
                        mro:represented_by  cco:Phoneme_th_voiced_Grapheme-th-ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_u_ICE
cco:Phoneme_u_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1659 ;
                mro:represented_by  cco:Phoneme_u_Grapheme-o-ICE ,
                                        cco:Phoneme_u_Grapheme-u-ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_ur__ICE
cco:Phoneme_ur__ICE rdf:type owl:NamedIndividual ,
                                cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1813 ;
                mro:represented_by  cco:Phoneme_ur__Grapheme-ar-ICE ,
                                        cco:Phoneme_ur__Grapheme-ear-ICE ,
                                        cco:Phoneme_ur__Grapheme-er-ICE ,
                                        cco:Phoneme_ur__Grapheme-ir-ICE ,
                                        cco:Phoneme_ur__Grapheme-or-ICE ,
                                        cco:Phoneme_ur__Grapheme-ur-ICE .

# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_v_ICE
cco:Phoneme_v_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1494 ;
                mro:represented_by  cco:Phoneme_v_Grapheme-v-ICE ,
                                        cco:Phoneme_v_Grapheme-ve-ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_w_ICE
cco:Phoneme_w_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1505 ;
                mro:represented_by  cco:Phoneme_w_Grapheme-w-ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_wh_with-breath_ICE
cco:Phoneme_wh_with-breath_ICE rdf:type owl:NamedIndividual ,
                                        cco:EnglishLanguagePhoneme ;
                                mro:designated_by cco:IPAPhonemeDesignator1_N1604 ;
                                mro:represented_by  cco:Phoneme_wh_with-breath_Grapheme-wh-ICE .





# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_y_ICE
cco:Phoneme_y_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1516 ;
                mro:represented_by  cco:Phoneme_y_Grapheme-i-ICE ,
                                        cco:Phoneme_y_Grapheme-y-ICE .



# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_z_ICE
cco:Phoneme_z_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1527 ;
                mro:represented_by  cco:Phoneme_z_Grapheme-s-ICE ,
                                        cco:Phoneme_z_Grapheme-se-ICE ,
                                        cco:Phoneme_z_Grapheme-x-ICE ,
                                        cco:Phoneme_z_Grapheme-z-ICE ,
                                        cco:Phoneme_z_Grapheme-ze-ICE ,
                                        cco:Phoneme_z_Grapheme-zz-ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_zh_ICE
cco:Phoneme_zh_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1593 ;
                mro:represented_by  cco:Phoneme_zh_Grapheme-ge-ICE ,
                                        cco:Phoneme_zh_Grapheme-s-ICE .



# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_ā_ICE
cco:Phoneme_ā_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1670 ;
                mro:represented_by  cco:Phoneme_ā_Grapheme-a-ICE ,
                                        cco:Phoneme_ā_Grapheme-a_e-ICE ,
                                        cco:Phoneme_ā_Grapheme-ai-ICE ,
                                        cco:Phoneme_ā_Grapheme-ay-ICE ,
                                        cco:Phoneme_ā_Grapheme-ei-ICE ,
                                        cco:Phoneme_ā_Grapheme-ey-ICE .

# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_ār__ICE
cco:Phoneme_ār__ICE rdf:type owl:NamedIndividual ,
                                cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1780 ;
                mro:represented_by  cco:Phoneme_ār__Grapheme-air-ICE ,
                                        cco:Phoneme_ār__Grapheme-are-ICE ,
                                        cco:Phoneme_ār__Grapheme-ear-ICE .

# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_ē_ICE
cco:Phoneme_ē_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1681 ;
                mro:represented_by  cco:Phoneme_ē_Grapheme-e-ICE ,
                                        cco:Phoneme_ē_Grapheme-e_e-ICE ,
                                        cco:Phoneme_ē_Grapheme-ea-ICE ,
                                        cco:Phoneme_ē_Grapheme-ee-ICE ,
                                        cco:Phoneme_ē_Grapheme-ey-ICE ,
                                        cco:Phoneme_ē_Grapheme-ie-ICE ,
                                        cco:Phoneme_ē_Grapheme-y-ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_ī_ICE
cco:Phoneme_ī_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1692 ;
                mro:represented_by  cco:Phoneme_ī_Grapheme-i-ICE ,
                                        cco:Phoneme_ī_Grapheme-i_e-ICE ,
                                        cco:Phoneme_ī_Grapheme-ie-ICE ,
                                        cco:Phoneme_ī_Grapheme-igh-ICE ,
                                        cco:Phoneme_ī_Grapheme-y-ICE .

# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_ō_ICE
cco:Phoneme_ō_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1703 ;
                mro:represented_by  cco:Phoneme_ō_Grapheme-o-ICE ,
                                        cco:Phoneme_ō_Grapheme-o_e-ICE ,
                                        cco:Phoneme_ō_Grapheme-oa-ICE ,
                                        cco:Phoneme_ō_Grapheme-ou-ICE ,
                                        cco:Phoneme_ō_Grapheme-ow-ICE .

# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_ōō_ICE
cco:Phoneme_ōō_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1736 ;
                mro:represented_by  cco:Phoneme_ōō_Grapheme-oo-ICE ,
                                        cco:Phoneme_ōō_Grapheme-u-ICE ,
                                        cco:Phoneme_ōō_Grapheme-u_e-ICE .


# http://www.ontologyrepository.com/CommonCoreOntologies/Phoneme_ū_ICE
cco:Phoneme_ū_ICE rdf:type owl:NamedIndividual ,
                        cco:EnglishLanguagePhoneme ;
                mro:designated_by cco:IPAPhonemeDesignator1_N1714 ;
                mro:represented_by  cco:Phoneme_ū_Grapheme-ew-ICE ,
                                        cco:Phoneme_ū_Grapheme-u-ICE ,
                                        cco:Phoneme_ū_Grapheme-u_e-ICE .
"""
               )
