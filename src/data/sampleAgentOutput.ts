{
    "agent_id": "agent_5301k4bt2r8gen9raer2e07sr5fr",
    "name": "Test-hi-Dhurv - De",
    "conversation_config": {
      "asr": {
        "quality": "high",
        "provider": "elevenlabs",
        "user_input_audio_format": "pcm_16000",
        "keywords": []
      },
      "turn": {
        "turn_timeout": 7,
        "silence_end_call_timeout": -1,
        "mode": "turn"
      },
      "tts": {
        "model_id": "eleven_turbo_v2_5",
        "voice_id": "PuJQTfDQxdwVwmQfuFOp",
        "supported_voices": [],
        "agent_output_audio_format": "pcm_16000",
        "optimize_streaming_latency": 3,
        "stability": 0.5,
        "speed": 1,
        "similarity_boost": 0.8,
        "pronunciation_dictionary_locators": []
      },
      "conversation": {
        "text_only": false,
        "max_duration_seconds": 600,
        "client_events": [
          "audio",
          "interruption",
          "agent_response",
          "user_transcript",
          "agent_response_correction",
          "agent_tool_response"
        ]
      },
      "language_presets": {},
      "agent": {
        "first_message": "",
        "language": "hi",
        "dynamic_variables": {
          "dynamic_variable_placeholders": {}
        },
        "prompt": {
          "prompt": "# Phone Sales Agent Prompt\n\nYou are a male professional phone sales consultant with extensive knowledge of current smartphone models, features, and pricing. Your goal is to help customers find the perfect phone that meets their specific needs and budget.\n\n## Your Role and Personality\n- you will speak only in Agent language\n- Speak in a warm, professional, and knowledgeable manner\n- Be patient and thorough in understanding customer needs\n- Show enthusiasm for technology while remaining helpful, not pushy\n- Use conversational language that's easy to understand\n- Avoid technical jargon unless the customer demonstrates advanced knowledge\n\n## Conversation Flow\n\n### 1. Greeting and Initial Assessment\n- Welcome the customer warmly\n- Ask what brings them in to look for a new phone today\n- Inquire about their current phone situation (upgrading, first phone, replacement, etc.)\n\n### 2. Needs Discovery Questions\nAsk detailed questions about:\n\n**Usage Patterns:**\n- How do you primarily use your phone? (calls, texting, social media, work, gaming, photography, etc.)\n- Are you a heavy user or more casual?\n- Do you use your phone for work or business purposes?\n\n**Technical Preferences:**\n- Do you prefer iOS (iPhone) or Android, or are you open to either?\n- What's your budget range?\n- Do you have a preferred screen size? (compact, standard, or large)\n- How important is camera quality to you?\n- Do you need long battery life?\n- How much storage do you typically use?\n\n**Lifestyle Factors:**\n- Do you travel frequently?\n- Are you active/outdoorsy? (need durability/water resistance)\n- Do you have other devices you'd like it to work with? (tablets, computers, smartwatches)\n\n### 3. Phone Recommendation Process\nBased on their answers:\n- Suggest 2-3 specific phone models that match their needs\n- Explain WHY each phone fits their requirements\n- Highlight key features that address their stated priorities\n- Mention any current promotions or deals\n- Provide clear pricing information\n\n### 4. Handling Objections or Rejections\nIf they don't like your suggestions:\n- Ask specific questions about what they didn't like\n- Inquire about deal-breakers or must-have features you might have missed\n- Ask if budget, features, or brand preference is the main concern\n- Probe deeper into their priorities to refine your understanding\n- Offer alternative suggestions based on this new information\n\n### 5. Additional Considerations\nAlways ask about:\n- Accessories they might need (cases, screen protectors, chargers)\n- Insurance or protection plans\n- Trade-in value of their current device\n- Carrier compatibility and plan considerations\n\n## Key Guidelines\n\n**Do:**\n- Listen actively and take notes on their responses\n- Ask follow-up questions to clarify vague answers\n- Explain technical features in terms of benefits to them\n- Be honest about limitations of phones you recommend\n- Offer multiple options at different price points when possible\n- Summarize their needs before making recommendations\n\n**Don't:**\n- Overwhelm them with too many options at once\n- Push the most expensive option if it doesn't fit their needs\n- Use confusing technical specifications\n- Rush the conversation\n- Make assumptions about what they want\n\n## Sample Conversation Starters\n- \"Hi there! I'd love to help you find the perfect phone today. What's your current phone situation - are you looking to upgrade, or do you need a replacement?\"\n- \"To make sure I suggest the best options for you, could you tell me a bit about how you typically use your phone?\"\n- \"What's most important to you in your next phone - amazing photos, long battery life, gaming performance, or something else?\"\n\n## Closing\n- Summarize the chosen phone and why it's perfect for them\n- Explain next steps for purchase\n- Offer to answer any final questions\n- Thank them for their time and express confidence in their choice\n\nRemember: Your success is measured by finding customers a phone they'll love, not by selling the most expensive option. Focus on matching their actual needs with the right device.",
          "llm": "gpt-4.1",
          "temperature": 0.1,
          "max_tokens": -1,
          "tool_ids": [],
          "built_in_tools": {
            "end_call": null,
            "language_detection": null,
            "transfer_to_agent": null,
            "transfer_to_number": null,
            "skip_turn": null,
            "play_keypad_touch_tone": null,
            "voicemail_detection": null
          },
          "mcp_server_ids": [],
          "native_mcp_server_ids": [],
          "knowledge_base": [],
          "custom_llm": null,
          "ignore_default_personality": false,
          "rag": {
            "enabled": false,
            "embedding_model": "e5_mistral_7b_instruct",
            "max_vector_distance": 0.6,
            "max_documents_length": 50000,
            "max_retrieved_rag_chunks_count": 20
          },
          "timezone": null,
          "tools": []
        }
      }
    },
    "metadata": {
      "created_at_unix_secs": 1757038076,
      "updated_at_unix_secs": 1757038597
    },
    "platform_settings": {
      "auth": {
        "enable_auth": false,
        "allowlist": [],
        "shareable_token": null
      },
      "evaluation": {
        "criteria": []
      },
      "widget": {
        "variant": "full",
        "placement": "bottom-right",
        "expandable": "never",
        "avatar": {
          "type": "orb",
          "color_1": "#2792dc",
          "color_2": "#9ce6e6"
        },
        "feedback_mode": "none",
        "bg_color": "#ffffff",
        "text_color": "#000000",
        "btn_color": "#000000",
        "btn_text_color": "#ffffff",
        "border_color": "#e1e1e1",
        "focus_color": "#000000",
        "border_radius": null,
        "btn_radius": null,
        "action_text": null,
        "start_call_text": null,
        "end_call_text": null,
        "expand_text": null,
        "listening_text": null,
        "speaking_text": null,
        "shareable_page_text": null,
        "shareable_page_show_terms": true,
        "terms_text": null,
        "terms_html": null,
        "terms_key": null,
        "show_avatar_when_collapsed": false,
        "disable_banner": false,
        "override_link": null,
        "mic_muting_enabled": false,
        "transcript_enabled": true,
        "text_input_enabled": false,
        "default_expanded": true,
        "always_expanded": false,
        "text_contents": {
          "main_label": null,
          "start_call": null,
          "start_chat": null,
          "new_call": null,
          "end_call": null,
          "mute_microphone": null,
          "change_language": null,
          "collapse": null,
          "expand": null,
          "copied": null,
          "accept_terms": null,
          "dismiss_terms": null,
          "listening_status": null,
          "speaking_status": null,
          "connecting_status": null,
          "chatting_status": null,
          "input_label": null,
          "input_placeholder": null,
          "input_placeholder_text_only": null,
          "input_placeholder_new_conversation": null,
          "user_ended_conversation": null,
          "agent_ended_conversation": null,
          "conversation_id": null,
          "error_occurred": null,
          "copy_id": null
        },
        "styles": {
          "base": null,
          "base_hover": null,
          "base_active": null,
          "base_border": null,
          "base_subtle": null,
          "base_primary": null,
          "base_error": null,
          "accent": null,
          "accent_hover": null,
          "accent_active": null,
          "accent_border": null,
          "accent_subtle": null,
          "accent_primary": null,
          "overlay_padding": null,
          "button_radius": null,
          "input_radius": null,
          "bubble_radius": null,
          "sheet_radius": null,
          "compact_sheet_radius": null,
          "dropdown_sheet_radius": null
        },
        "language_selector": false,
        "supports_text_only": false,
        "custom_avatar_path": null,
        "language_presets": {}
      },
      "data_collection": {},
      "overrides": {
        "conversation_config_override": {
          "tts": {
            "voice_id": false,
            "stability": false,
            "speed": false,
            "similarity_boost": false
          },
          "conversation": {
            "text_only": true
          },
          "agent": {
            "first_message": false,
            "language": false,
            "prompt": {
              "prompt": false,
              "native_mcp_server_ids": false
            }
          }
        },
        "custom_llm_extra_body": false,
        "enable_conversation_initiation_client_data_from_webhook": false
      },
      "call_limits": {
        "agent_concurrency_limit": -1,
        "daily_limit": 100000,
        "bursting_enabled": true
      },
      "ban": null,
      "privacy": {
        "record_voice": true,
        "retention_days": -1,
        "delete_transcript_and_pii": false,
        "delete_audio": false,
        "apply_to_existing_conversations": false,
        "zero_retention_mode": false
      },
      "workspace_overrides": {
        "conversation_initiation_client_data_webhook": null,
        "webhooks": {
          "post_call_webhook_id": null,
          "send_audio": false
        }
      },
      "testing": {
        "attached_tests": [],
        "referenced_tests_ids": []
      },
      "safety": {
        "is_blocked_ivc": false,
        "is_blocked_non_ivc": false,
        "ignore_safety_evaluation": false
      }
    },
    "phone_numbers": [],
    "workflow": {
      "edges": {},
      "nodes": {
        "start_node": {
          "type": "start",
          "position": {
            "x": 0,
            "y": 0
          }
        }
      }
    },
    "access_info": {
      "is_creator": true,
      "creator_name": "Amit Velingkar",
      "creator_email": "amit.velingkar@mindtickle.com",
      "role": "admin"
    },
    "tags": []
  }